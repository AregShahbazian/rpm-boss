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

    private AudioRecord recorder;
    private Thread reader;
    private volatile boolean running;
    private ByteArrayOutputStream captured;
    private int activeSource;
    private int activeRate;

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

    @com.getcapacitor.annotation.PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("denied", "mic-denied");
            return;
        }
        begin(call);
    }

    private void begin(PluginCall call) {
        if (running) {
            call.reject("busy", "record-failed");
            return;
        }

        for (int source : SOURCES) {
            for (int rate : RATES) {
                int minBuffer = AudioRecord.getMinBufferSize(
                    rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT
                );
                if (minBuffer <= 0) continue;
                AudioRecord candidate;
                try {
                    candidate = new AudioRecord(
                        source, rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, minBuffer * 4
                    );
                } catch (IllegalArgumentException | SecurityException e) {
                    continue;
                }
                if (candidate.getState() != AudioRecord.STATE_INITIALIZED) {
                    candidate.release();
                    continue;
                }
                recorder = candidate;
                activeSource = source;
                activeRate = rate;
                break;
            }
            if (recorder != null) break;
        }

        if (recorder == null) {
            call.reject("no-mic", "no-mic");
            return;
        }

        captured = new ByteArrayOutputStream();
        running = true;
        try {
            recorder.startRecording();
        } catch (IllegalStateException e) {
            release();
            call.reject("record-failed", "record-failed");
            return;
        }

        final int chunk = 4096;
        reader = new Thread(() -> {
            byte[] buffer = new byte[chunk];
            while (running) {
                int read = recorder.read(buffer, 0, chunk);
                if (read > 0) {
                    synchronized (captured) {
                        captured.write(buffer, 0, read);
                    }
                }
            }
        }, "rpmboss-capture");
        reader.start();

        JSObject result = new JSObject();
        result.put("source", sourceName(activeSource));
        result.put("sampleRate", activeRate);
        // What the device claims, next to what it gave. A device that advertises
        // UNPROCESSED and then downgrades is exactly the failure worth catching.
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
        if (!running) {
            call.reject("not-recording", "record-failed");
            return;
        }
        running = false;
        try {
            if (reader != null) reader.join(500);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }

        byte[] pcm;
        synchronized (captured) {
            pcm = captured.toByteArray();
        }
        int source = activeSource;
        int rate = activeRate;
        release();

        // The whole take crosses the bridge once. Ten seconds is 320 kB; going
        // frame by frame to save that would cost hundreds of crossings.
        JSObject result = new JSObject();
        result.put("pcm16", Base64.encodeToString(pcm, Base64.NO_WRAP));
        result.put("sampleRate", rate);
        result.put("source", sourceName(source));
        call.resolve(result);
    }

    private void release() {
        running = false;
        if (recorder != null) {
            try {
                if (recorder.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) recorder.stop();
            } catch (IllegalStateException ignored) {
            }
            recorder.release();
            recorder = null;
        }
        reader = null;
    }

    @Override
    protected void handleOnDestroy() {
        release();
    }
}
