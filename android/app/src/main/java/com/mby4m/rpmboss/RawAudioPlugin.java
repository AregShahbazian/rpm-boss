package com.mby4m.rpmboss;

import android.Manifest;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.ByteArrayOutputStream;

/**
 * Raw microphone capture, which is the whole reason this app is native.
 *
 * Android will not give a web page unprocessed audio: with echo cancellation on
 * the platform gates a steady engine note about a second in, and turning it off
 * produced silence on one of the two browsers tested. AudioRecord on
 * UNPROCESSED bypasses that entire chain. See the phase 4 discussion note.
 *
 * MediaRecorder is deliberately not used here. It writes a container and
 * applies the same voice processing; AudioRecord hands back PCM, which is what
 * the analysis wants anyway.
 */
@CapacitorPlugin(
    name = "RawAudio",
    permissions = { @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }) }
)
public class RawAudioPlugin extends Plugin {

    /**
     * Tried in order. UNPROCESSED is optional: a device may fail to open it, or
     * accept it and quietly route to MIC. Whichever one opens is reported back
     * with the audio, so a recording that behaves oddly can always be traced to
     * the source it actually came from.
     */
    private static final int[] SOURCES = {
        MediaRecorder.AudioSource.UNPROCESSED,
        MediaRecorder.AudioSource.VOICE_RECOGNITION,
        MediaRecorder.AudioSource.MIC
    };

    private static final int[] RATES = { 16000, 48000, 44100 };
    private static final int CHUNK_BYTES = 4096;
    private static final int BYTES_PER_FRAME = 2;
    private static final double DEFAULT_MAX_S = 10;

    /**
     * One recording. Everything the reader thread touches lives here and is
     * handed to it as a final local, so a take that is being torn down can
     * never be confused with the next one.
     */
    private static final class Take {
        final AudioRecord recorder;
        final ByteArrayOutputStream out = new ByteArrayOutputStream();
        final int source;
        final int rate;
        final int maxBytes;
        volatile boolean running = true;
        /** A negative AudioRecord error code, or 0 if the read loop was healthy. */
        volatile int readError = 0;
        Thread reader;

        Take(AudioRecord recorder, int source, int rate, int maxBytes) {
            this.recorder = recorder;
            this.source = source;
            this.rate = rate;
            this.maxBytes = maxBytes;
        }
    }

    private Take take;

    private static String sourceName(int source) {
        if (source == MediaRecorder.AudioSource.UNPROCESSED) return "UNPROCESSED";
        if (source == MediaRecorder.AudioSource.VOICE_RECOGNITION) return "VOICE_RECOGNITION";
        return "MIC";
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "permissionCallback");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            // The message carries the code the web layer maps on; Capacitor
            // keeps `message` and `code` apart across the bridge, so the two
            // are deliberately the same string.
            call.reject("mic-denied", "mic-denied");
            return;
        }
        begin(call);
    }

    private synchronized void begin(PluginCall call) {
        if (take != null) {
            call.reject("record-failed", "record-failed");
            return;
        }

        double maxS = call.getDouble("maxS", DEFAULT_MAX_S);
        AudioRecord opened = null;
        int source = 0;
        int rate = 0;

        outer:
        for (int candidateSource : SOURCES) {
            for (int candidateRate : RATES) {
                int minBuffer = AudioRecord.getMinBufferSize(
                    candidateRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT
                );
                if (minBuffer <= 0) continue;
                AudioRecord candidate;
                try {
                    candidate = new AudioRecord(
                        candidateSource, candidateRate, AudioFormat.CHANNEL_IN_MONO,
                        AudioFormat.ENCODING_PCM_16BIT, minBuffer * 4
                    );
                } catch (IllegalArgumentException | SecurityException e) {
                    continue;
                }
                if (candidate.getState() != AudioRecord.STATE_INITIALIZED) {
                    candidate.release();
                    continue;
                }
                opened = candidate;
                source = candidateSource;
                rate = candidateRate;
                break outer;
            }
        }

        if (opened == null) {
            call.reject("no-mic", "no-mic");
            return;
        }

        // A native cap as well as the web one. The web hard stop is a JS
        // timer, and Android suspends those when the activity is stopped, so
        // switching apps mid-recording would otherwise hold the microphone and
        // grow the buffer with nobody left to stop it.
        int maxBytes = (int) Math.ceil(maxS * rate) * BYTES_PER_FRAME;
        final Take t = new Take(opened, source, rate, maxBytes);

        try {
            t.recorder.startRecording();
        } catch (IllegalStateException e) {
            t.recorder.release();
            call.reject("record-failed", "record-failed");
            return;
        }
        take = t;

        t.reader = new Thread(() -> {
            byte[] buffer = new byte[CHUNK_BYTES];
            while (t.running) {
                int read = t.recorder.read(buffer, 0, CHUNK_BYTES);
                if (read > 0) {
                    synchronized (t.out) {
                        t.out.write(buffer, 0, read);
                        if (t.out.size() >= t.maxBytes) t.running = false;
                    }
                } else if (read < 0) {
                    // The microphone went away: a call came in, or another app
                    // took it. Reading again would spin a core for nothing.
                    t.readError = read;
                    t.running = false;
                }
            }
        }, "rpmboss-capture");
        t.reader.start();

        // Logged unconditionally, not only in a debug build: which source the
        // device actually gave is the first thing worth knowing about a
        // recording that behaves oddly, and a release APK on a phone has no
        // other way to say it.
        android.util.Log.i(
            "RawAudio",
            "opened source=" + sourceName(t.source) + " rate=" + t.rate +
            " deviceClaimsUnprocessed=" + claimsUnprocessed()
        );

        JSObject result = new JSObject();
        result.put("source", sourceName(t.source));
        result.put("sampleRate", t.rate);
        result.put("claimsUnprocessed", claimsUnprocessed());
        call.resolve(result);
    }

    private boolean claimsUnprocessed() {
        try {
            android.media.AudioManager am =
                (android.media.AudioManager) getContext().getSystemService(android.content.Context.AUDIO_SERVICE);
            return "true".equals(am.getProperty(android.media.AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED));
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Take finished = end();
        if (finished == null) {
            call.reject("record-failed", "record-failed");
            return;
        }
        if (finished.readError != 0) {
            android.util.Log.w("RawAudio", "read failed with " + finished.readError);
            call.reject("no-audio", "no-audio");
            return;
        }

        byte[] pcm;
        synchronized (finished.out) {
            pcm = finished.out.toByteArray();
        }

        // The whole take crosses the bridge once. Ten seconds is 320 kB; going
        // frame by frame to save that would cost hundreds of crossings.
        JSObject result = new JSObject();
        result.put("pcm16", Base64.encodeToString(pcm, Base64.NO_WRAP));
        result.put("sampleRate", finished.rate);
        result.put("source", sourceName(finished.source));
        call.resolve(result);
    }

    /**
     * Stop the current take and wait for its reader to leave `read()` before
     * releasing the recorder underneath it. Unconditional: releasing a native
     * AudioRecord while a thread is still reading it is a crash on a thread
     * nobody is catching.
     */
    private Take end() {
        Take finished;
        synchronized (this) {
            finished = take;
            take = null;
        }
        if (finished == null) return null;

        finished.running = false;
        if (finished.reader != null) {
            try {
                finished.reader.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        try {
            if (finished.recorder.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
                finished.recorder.stop();
            }
        } catch (IllegalStateException ignored) {
        }
        finished.recorder.release();
        return finished;
    }

    @Override
    protected void handleOnDestroy() {
        end();
    }
}
