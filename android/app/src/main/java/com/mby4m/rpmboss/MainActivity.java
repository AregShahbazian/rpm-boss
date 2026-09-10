package com.mby4m.rpmboss;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(RawAudioPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
