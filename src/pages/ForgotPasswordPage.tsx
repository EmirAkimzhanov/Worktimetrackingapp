import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForgotPassword } from '../hooks/UseAuth';

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

const FormContainer = styled.div`
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

const SubmitButton = styled.button`
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

const InfoMessage = styled.div`
  background: #e3f2fd;
  color: #1565c0;
  padding: 14px 18px;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 4px solid #1565c0;
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

const extractErrorMessage = (error: any): string => {
    console.log('Error object:', error);

    if (!error) return 'An unexpected error occurred';

    if (error.message) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error?.response?.data?.detail) {
        return error.response.data.detail;
    }

    return 'An unexpected error occurred. Please try again.';
};

const ForgotPasswordPage = () => {
    const navigate = useNavigate();

    // Forgot password form state
    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { mutate: forgotPassword, isPending: isForgotPending } = useForgotPassword();

    // Шаг 1: Запрос на восстановление пароля
    const handleForgotPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);
        setSuccessMessage(null);
        setInfoMessage(null);

        if (!email.trim()) {
            setFormError('Please enter your email address');
            return;
        }

        if (!email.includes('@')) {
            setFormError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        forgotPassword(
            { email },
            {
                onSuccess: (response) => {
                    setSuccessMessage('Reset code has been sent to your email!');
                    setInfoMessage('Please check your inbox and enter the code on the next page.');

                    // Навигация на страницу /reset после успешной отправки
                    setTimeout(() => {
                        navigate('/reset', { state: { email: email } });
                    }, 1500);
                },
                onError: (error) => {
                    const errorMessage = extractErrorMessage(error);
                    setFormError(errorMessage);
                    setIsLoading(false);
                }
            }
        );
    };

    return (
        <LoginContainer>
            <LoginCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <LoginHeader>
                    <Logo>
                        <LogoIcon>🔐</LogoIcon>
                        <LogoText>
                            <CompanyName>TIME TRACKER</CompanyName>
                        </LogoText>
                    </Logo>
                    <Tagline>Reset your password and get back to work</Tagline>
                </LoginHeader>

                <FormContainer>
                    {formError && (
                        <ErrorMessage>
                            ⚠️ {formError}
                        </ErrorMessage>
                    )}

                    {successMessage && !formError && (
                        <SuccessMessage>
                            ✓ {successMessage}
                        </SuccessMessage>
                    )}

                    {infoMessage && !formError && !successMessage && (
                        <InfoMessage>
                            ℹ️ {infoMessage}
                        </InfoMessage>
                    )}

                    <form onSubmit={handleForgotPasswordSubmit}>
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
                                disabled={isLoading || isForgotPending}
                            />
                        </FormGroup>

                        <SubmitButton type="submit" disabled={isLoading || isForgotPending}>
                            {(isLoading || isForgotPending) ? (
                                <>
                                    <LoadingSpinner />
                                    Sending reset code...
                                </>
                            ) : (
                                'Send Reset Code'
                            )}
                        </SubmitButton>

                        <FooterLinks>
                            <FooterLink href="/login">Back to Sign In</FooterLink>
                            <span style={{ margin: '0 12px', color: '#d1d5db' }}>•</span>
                            <FooterLink href="/support">Need Help?</FooterLink>
                        </FooterLinks>
                    </form>
                </FormContainer>
            </LoginCard>
        </LoginContainer>
    );
};

export default ForgotPasswordPage;