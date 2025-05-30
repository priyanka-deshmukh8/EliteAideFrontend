import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import tw from 'twrnc';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { Button } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { OTPRouteProp, OTPNavigationProp } from '../../types/navigation';
import { BASE_URL } from '@env';
import { Vibration } from 'react-native';
import Background from '../../components/Background';

// Import the logo image
import LogoImage from '../../assets/vector.png';

type Props = {
  route: OTPRouteProp;
  navigation: OTPNavigationProp;
};

const Otp: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;

  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Countdown timer for resend button
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    if (timer === 0) setIsResendDisabled(false);

    return () => clearInterval(countdown);
  }, [timer]);

  // Function to handle OTP input change
  const handleOtpChange = (value: string, index: number) => {
    if (/^[0-9]*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < otp.length - 1) {
        otpRefs.current[index + 1]?.focus();
      } else if (!value && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else {
      Vibration.vibrate(100);
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please enter a single digit (0-9).',
      });
    }
  };

  // Function to verify OTP
  const handleVerifyOtp = async () => {
    const userOtp = otp.join('');
    console.log('Entered OTP:', userOtp);

    if (userOtp.length === 4) {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}v1/users/otp/validate/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: userOtp }),
        });
        const data = await response.json();
        console.log('OTP Verification Response:', data);
        setLoading(false);

        if (data.message?.toLowerCase() === 'otp verified') {
          setError(false); // Clear error state
          Toast.show({ type: 'success', text1: 'OTP verified successfully!' });
          navigation.replace('SignUp', { email, otp: userOtp, key: data.key });
        } else {
          setError(true); // Set error state
          Vibration.vibrate(100); // Haptic feedback on error
          Toast.show({ type: 'error', text1: 'Invalid OTP. Please try again.' });
          setOtp(['', '', '', '']); // Clear OTP input

          // Reset error state after a short duration
          setTimeout(() => setError(false), 1000); // 1 second duration
        }
      } catch (error) {
        setLoading(false);
        console.error('Error verifying OTP:', error);
        Vibration.vibrate(100); // Haptic feedback on error
        Toast.show({ type: 'error', text1: 'Network error. Please try again.' });

        // Reset error state after a short duration
        setTimeout(() => setError(false), 1000); // 1 second duration
      }
    } else {
      setError(true); // Set error state
      Vibration.vibrate(100); // Haptic feedback on error
      Toast.show({
        type: 'error',
        text1: 'Incomplete OTP',
        text2: 'Please enter the 4-digit OTP',
      });

      // Reset error state after a short duration
      setTimeout(() => setError(false), 1000); // 1 second duration
    }
  };

  // Function to resend OTP
  const handleResendOtp = async () => {
    setIsResendDisabled(true);
    setOtp(['', '', '', '']);
    setTimer(30);
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}v1/users/otp/send/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('OTP Resend Response:', data);
      setLoading(false);

      if (data.success) {
        Toast.show({ type: 'success', text1: 'OTP resent successfully' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to resend OTP' });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error resending OTP:', error);
      Toast.show({ type: 'error', text1: 'Failed to resend OTP. Please check your connection.' });
    }
  };

  return (
    <Background>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow px-6 pt-24`}>
          {/* Back button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={tw`m-4 w-10 h-10 justify-center items-center bg-[#1D1E23] rounded-full`}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Logo */}
          <Image
            source={LogoImage}
            style={[
              tw`mb-6`,
              {
                width: 120,
                height: 55,
                transform: [{ rotate: '0.81deg' }],
              }
            ]}
            resizeMode="contain"
          />

          {/* Text content */}
          <Text style={tw`text-white text-2xl font-semibold mb-2`}>
            Enter the 4-digit code sent to
          </Text>
          <Text style={tw`text-[#979797] text-lg mb-1`}>{email}</Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={tw`text-[#979797]`}>
              Wrong Address? <Text style={tw`text-[#65779E] font-semibold`}>Re-enter</Text>
            </Text>
          </TouchableOpacity>

          {/* OTP Input with enhanced UX */}
          <View style={tw`flex-row justify-between mb-8 mt-10`}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={[
                  tw`w-16 h-16 bg-[#111111] border rounded-xl text-center text-white text-xl`,
                  focusedIndex === index && tw`border-[#65779E]`, // Highlight current input
                  { borderColor: error ? 'red' : '#262626' } // Error highlighting
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                keyboardType="numeric"
                maxLength={1}
                ref={(el) => (otpRefs.current[index] = el)}
                onFocus={() => setFocusedIndex(index)} // Set focused index
                onBlur={() => setFocusedIndex(null)} // Clear focused index
                accessibilityLabel={`OTP digit ${index + 1}`} // Accessibility label
              />
            ))}
          </View>

          {/* Resend code with smooth transition */}
          <TouchableOpacity 
            onPress={handleResendOtp} 
            disabled={isResendDisabled}
            style={tw`items-center mb-8`}
          >
            <Text style={tw`text-[#65779E] transition-opacity duration-300`}>
              {isResendDisabled ? `Resend code in ${timer}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>

          {/* Continue Button with 3D effect */}
          <Button
            mode="contained"
            onPress={handleVerifyOtp}
            disabled={loading}
            style={[
              tw`rounded-xl mb-4`,
              {
                backgroundColor: '#1D1E23',
                transform: [{ translateY: 0 }],
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }
            ]}
            contentStyle={[
              tw`py-2`,
              {
                transform: [{ translateY: -1 }],
              }
            ]}
            labelStyle={[
              tw`text-white font-bold`,
              {
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }
            ]}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : 'Continue'}
          </Button>

          {/* Step indicator */}
          <View style={tw`items-center mb-1`}>
            <Text style={tw`text-[#979797] text-sm`}>
              Step <Text style={tw`text-[#65779E] font-semibold`}>2</Text>/3
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
};

export default React.memo(Otp);