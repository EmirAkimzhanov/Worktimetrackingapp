import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useActivateAccount, useCheckMe, useLogin } from '../hooks/UseAuth';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1F4E78 0%, #00A3A1 100%);
  padding: 20px;
`;

const LoginCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const LoginHeader = styled.div`
  background: linear-gradient(135deg, #1F4E78 0%, #00A3A1 100%);
  color: white;
  padding: 40px 32px;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1F4E78;
  font-weight: bold;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const LogoText = styled.div`
  text-align: left;
`;

const CompanyName = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
`;

const Tagline = styled.p`
  font-size: 15px;
  opacity: 0.9;
  margin: 16px 0 0 0;
  line-height: 1.5;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #f0f2f5;
  padding: 0 32px;
  background: white;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 20px 0 16px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$active ? '#1F4E78' : '#9ca3af'};
  border-bottom: 3px solid ${props => props.$active ? '#1F4E78' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  bottom: -2px;
  
  &:hover {
    color: #1F4E78;
  }
`;

const LoginForm = styled.form`
  padding: 40px 32px 32px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.3px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  color: #1F2937;
  
  &:focus {
    outline: none;
    border-color: #1F4E78;
    box-shadow: 0 0 0 3px rgba(31, 78, 120, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #1F4E78 0%, #00A3A1 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  letter-spacing: 0.3px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(31, 78, 120, 0.25);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 14px 18px;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 4px solid #c62828;
`;

const SuccessMessage = styled.div`
  background: #e8f5e9;
  color: #2e7d32;
  padding: 14px 18px;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 4px solid #2e7d32;
`;

const FooterLinks = styled.div`
  text-align: center;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #f3f4f6;
`;

const FooterLink = styled.a`
  color: #1F4E78;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 500;
  
  &:hover {
    color: #00A3A1;
    text-decoration: underline;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const PasswordStrengthIndicator = styled.div<{ $strength: number }>`
  height: 4px;
  background: ${props => {
    if (props.$strength === 0) return '#e5e7eb';
    if (props.$strength === 1) return '#f44336';
    if (props.$strength === 2) return '#ff9800';
    if (props.$strength === 3) return '#4caf50';
    return '#e5e7eb';
  }};
  width: ${props => (props.$strength / 3) * 100}%;
  border-radius: 2px;
  margin-top: 6px;
  transition: all 0.3s ease;
`;

type TabType = 'signin' | 'activate';

// Упрощенная функция для извлечения сообщения об ошибке
const extractErrorMessage = (error: any): string => {
  console.log('Error object:', error);

  if (!error) return 'An unexpected error occurred';

  // Если ошибка уже имеет message (из сервиса)
  if (error.message) {
    return error.message;
  }

  // Если error - это строка
  if (typeof error === 'string') {
    return error;
  }

  // Прямой доступ к response.data.detail (на всякий случай)
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }

  return 'An unexpected error occurred. Please try again.';
};
const TimeTrackerLogin = () => {
  const [activeTab, setActiveTab] = useState<TabType>('signin');

  // Sign In form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Activate Account form state
  const [activateEmail, setActivateEmail] = useState('');
  const [activatePassword, setActivatePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationKey, setActivationKey] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { mutate: login, isPending: isLoginPending, error: loginError } = useLogin();
  const { mutate: activate, isPending: isActivatePending, error: activateError, isSuccess: isActivateSuccess } = useActivateAccount();

  const { mutate: checkMe } = useCheckMe();

  const calculatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[A-Z]/) && pass.match(/[a-z]/)) strength++;
    if (pass.match(/[0-9]/) && pass.match(/[^A-Za-z0-9]/)) strength++;
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setActivatePassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
    setFormError(null);
  };

  const handleSignInSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    login(
      { email, password },
      {
        onSuccess: async (response) => {
          console.log('Login success response:', response);
          await checkMe();
          setSuccessMessage('Login successful');
          setFormError(null);
        },
        onError: (error) => {
          console.error('Login error:', error);
          const errorMessage = extractErrorMessage(error);
          setFormError(errorMessage);
        }
      }
    );
  };

  const handleActivateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Validation
    if (!activateEmail.trim()) {
      setFormError('Please enter your email address');
      return;
    }

    if (!activateEmail.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!activatePassword.trim()) {
      setFormError('Please create a password');
      return;
    }

    if (activatePassword.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    if (activatePassword !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (!activationKey.trim()) {
      setFormError('Please enter your activation key');
      return;
    }

    if (activationKey.length < 6) {
      setFormError('Activation key must be at least 6 characters');
      return;
    }

    // Call the activation API
    activate({
      email: activateEmail,
      activation_code: activationKey,
      password: activatePassword,
      password_confirm: confirmPassword
    }, {
      onSuccess: (response) => {
        console.log('Activation success response:', response);
      },
      onError: (error) => {
        console.error('Activation error:', error);
        const errorMessage = extractErrorMessage(error);
        setFormError(errorMessage);
      }
    });
  };

  // Handle successful activation
  React.useEffect(() => {
    if (isActivateSuccess) {
      setSuccessMessage('Account activated successfully! You can now sign in.');

      // Clear form
      setActivateEmail('');
      setActivatePassword('');
      setConfirmPassword('');
      setActivationKey('');
      setPasswordStrength(0);

      // Switch to sign in tab after 2 seconds
      setTimeout(() => {
        setActiveTab('signin');
        setSuccessMessage(null);
      }, 2000);
    }
  }, [isActivateSuccess]);

  // Формируем сообщение об ошибке для отображения
  const getDisplayError = () => {
    if (activeTab === 'signin') {
      if (loginError) {
        return extractErrorMessage(loginError);
      }
      return formError;
    } else {
      if (activateError) {
        return extractErrorMessage(activateError);
      }
      return formError;
    }
  };

  const displayError = getDisplayError();

  return (
    <LoginContainer>
      <LoginCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <LoginHeader>
          <Logo>
            <LogoIcon>⏱</LogoIcon>
            <LogoText>
              <CompanyName>TIME TRACKER</CompanyName>
            </LogoText>
          </Logo>
          <Tagline>Track your work hours and manage projects efficiently</Tagline>
        </LoginHeader>

        <TabsContainer>
          <Tab
            $active={activeTab === 'signin'}
            onClick={() => {
              setActiveTab('signin');
              setFormError(null);
              setSuccessMessage(null);
            }}
          >
            Sign In
          </Tab>
          <Tab
            $active={activeTab === 'activate'}
            onClick={() => {
              setActiveTab('activate');
              setFormError(null);
              setSuccessMessage(null);
            }}
          >
            Activate Account
          </Tab>
        </TabsContainer>

        {activeTab === 'signin' ? (
          <LoginForm onSubmit={handleSignInSubmit}>
            {displayError && (
              <ErrorMessage>
                ⚠️ {displayError}
              </ErrorMessage>
            )}

            {successMessage && !displayError && (
              <SuccessMessage>
                ✓ {successMessage}
              </SuccessMessage>
            )}

            <FormGroup>
              <InputLabel>Email Address</InputLabel>
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError(null);
                }}
                required
                disabled={isLoginPending}
              />
            </FormGroup>

            <FormGroup>
              <InputLabel>Password</InputLabel>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError(null);
                }}
                required
                disabled={isLoginPending}
              />
            </FormGroup>

            <LoginButton type="submit" disabled={isLoginPending}>
              {isLoginPending ? (
                <>
                  <LoadingSpinner />
                  Signing in...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </LoginButton>

            <FooterLinks>
              <FooterLink href="#forgot">Forgot Password?</FooterLink>
              <span style={{ margin: '0 12px', color: '#d1d5db' }}>•</span>
              <FooterLink href="#support">Need Help?</FooterLink>
            </FooterLinks>
          </LoginForm>
        ) : (
          <LoginForm onSubmit={handleActivateSubmit}>
            {displayError && (
              <ErrorMessage>
                ⚠️ {displayError}
              </ErrorMessage>
            )}

            {successMessage && !displayError && (
              <SuccessMessage>
                ✓ {successMessage}
              </SuccessMessage>
            )}

            <FormGroup>
              <InputLabel>Email Address</InputLabel>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={activateEmail}
                onChange={(e) => {
                  setActivateEmail(e.target.value);
                  setFormError(null);
                }}
                required
                disabled={isActivatePending || isActivateSuccess}
              />
            </FormGroup>

            <FormGroup>
              <InputLabel>Create Password</InputLabel>
              <Input
                type="password"
                placeholder="Create a strong password"
                value={activatePassword}
                onChange={handlePasswordChange}
                required
                disabled={isActivatePending || isActivateSuccess}
              />
              {activatePassword && !isActivateSuccess && (
                <PasswordStrengthIndicator $strength={passwordStrength} />
              )}
              {activatePassword && passwordStrength < 3 && !isActivateSuccess && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Password strength: {
                    passwordStrength === 0 ? 'Too weak' :
                      passwordStrength === 1 ? 'Weak' :
                        passwordStrength === 2 ? 'Medium' : 'Strong'
                  }
                </p>
              )}
            </FormGroup>

            <FormGroup>
              <InputLabel>Confirm Password</InputLabel>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFormError(null);
                }}
                required
                disabled={isActivatePending || isActivateSuccess}
              />
            </FormGroup>

            <FormGroup>
              <InputLabel>Activation Key</InputLabel>
              <Input
                type="text"
                placeholder="Enter your activation key"
                value={activationKey}
                onChange={(e) => {
                  setActivationKey(e.target.value);
                  setFormError(null);
                }}
                required
                disabled={isActivatePending || isActivateSuccess}
              />
            </FormGroup>

            <LoginButton
              type="submit"
              disabled={isActivatePending || isActivateSuccess}
            >
              {isActivatePending ? (
                <>
                  <LoadingSpinner />
                  Activating...
                </>
              ) : isActivateSuccess ? (
                'Activation Complete!'
              ) : (
                'Activate Account'
              )}
            </LoginButton>

            <FooterLinks>
              <FooterLink href="#resend-key">Resend Activation Key</FooterLink>
              <span style={{ margin: '0 12px', color: '#d1d5db' }}>•</span>
              <FooterLink href="#support">Contact Support</FooterLink>
            </FooterLinks>
          </LoginForm>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default TimeTrackerLogin;  