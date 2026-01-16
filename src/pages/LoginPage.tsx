import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useLogin } from '../hooks/UseAuth';

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
  max-width: 420px;
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

const AppName = styled.h2`
  font-size: 16px;
  font-weight: 400;
  opacity: 0.95;
  margin: 4px 0 0 0;
  letter-spacing: 0.5px;
`;

const Tagline = styled.p`
  font-size: 15px;
  opacity: 0.9;
  margin: 16px 0 0 0;
  line-height: 1.5;
`;

const LoginForm = styled.form`
  padding: 40px 32px 32px;
`;

const FormGroup = styled.div`
  margin-bottom: 28px;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 10px;
  color: #374151;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.3px;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 18px;
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
  padding: 17px;
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

const FooterLinks = styled.div`
  text-align: center;
  margin-top: 32px;
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

const TimeTrackerLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const { mutate: login, isPending, error } = useLogin();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);

        // Basic validation
        if (!email.trim() || !password.trim()) {
            setFormError('Please enter both email and password');
            return;
        }

        if (!email.includes('@')) {
            setFormError('Please enter a valid email address');
            return;
        }

        // Call the login mutation
        login({ email, password });
    };

    // Use the error from mutation if it exists, otherwise use form error
    const displayError = error?.message || formError;

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
                            <CompanyName>Professional</CompanyName>
                            <AppName>TIME TRACKER</AppName>
                        </LogoText>
                    </Logo>
                    <Tagline>Sign in to track your work hours and manage projects</Tagline>
                </LoginHeader>

                <LoginForm onSubmit={handleSubmit}>
                    {displayError && (
                        <ErrorMessage>
                            ⚠️ {displayError}
                        </ErrorMessage>
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
                            disabled={isPending}
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
                            disabled={isPending}
                        />
                    </FormGroup>

                    <LoginButton type="submit" disabled={isPending}>
                        {isPending ? (
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
            </LoginCard>
        </LoginContainer>
    );
};

export default TimeTrackerLogin;