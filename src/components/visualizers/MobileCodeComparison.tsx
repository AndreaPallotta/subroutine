import React from 'react';
import { TabbedCodeBlock } from '../ui/TabbedCodeBlock';

export const MobileCodeComparison: React.FC = () => {
  const snippets = {
    swift: {
      label: 'Swift (iOS Native)',
      ext: 'swift',
      lang: 'swift',
      code: `import UIKit
import CoreMotion

// Pure Native Swift: Direct execution on native main thread (0.0ms overhead)
class NativeMotionManager {
    private let motion = CMMotionManager()

    func startAccelerometer() {
        // Direct C/Swift FFI call into Apple CoreMotion framework
        motion.startAccelerometerUpdates(to: .main) { data, error in
            guard let data = data else { return }
            print("X: \(data.acceleration.x), Y: \(data.acceleration.y)")
        }
    }
}`
    },
    kotlin: {
      label: 'Kotlin (Android Native)',
      ext: 'kt',
      lang: 'java',
      code: `package cc.subroutine.nativeapp

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager

// Pure Native Kotlin: Direct execution via Android NDK/JNI Hardware Sensor API
class NativeSensorListener(private val sensorManager: SensorManager) : SensorEventListener {

    fun register() {
        val accel = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        sensorManager.registerListener(this, accel, SensorManager.SENSOR_DELAY_FASTEST)
    }

    override fun onSensorChanged(event: SensorEvent?) {
        val x = event?.values?.get(0) ?: 0f
        val y = event?.values?.get(1) ?: 0f
        println("X: $x, Y: $y")
    }
}`
    },
    reactnative: {
      label: 'React Native (TypeScript JSI)',
      ext: 'tsx',
      lang: 'ts',
      code: `import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Accelerometer } from 'expo-sensors';

// React Native: Async invocation marshalled across JS Thread -> JSI C++ Bridge -> Native Thread
export function MotionComponent() {
  useEffect(() => {
    // Subscription sends async event bridge messages across JSI boundary (~2.5ms latency)
    const subscription = Accelerometer.addListener(data => {
      console.log(\`X: \${data.x}, Y: \${data.y}\`);
    });
    return () => subscription.remove();
  }, []);

  return <View><Text>React Native Sensor Stream</Text></View>;
}`
    },
    flutter: {
      label: 'Flutter (Dart Engine)',
      ext: 'dart',
      lang: 'dart',
      code: `import 'package:flutter/material.dart';
import 'package:sensors_plus/sensors_plus.dart';

// Flutter: Directly calls Dart AOT compiled C++ engine bindings (~0.8ms latency)
class MotionWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AccelerometerEvent>(
      stream: accelerometerEventStream(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return CircularProgressIndicator();
        return Text("X: \${snapshot.data!.x}, Y: \${snapshot.data!.y}");
      },
    );
  }
}`
    }
  };

  return <TabbedCodeBlock title="Mobile Platform API Execution Comparison" snippets={snippets} defaultLang="swift" />;
};
