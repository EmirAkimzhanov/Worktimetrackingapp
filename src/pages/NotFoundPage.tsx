import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';

/* 🔥 стили */
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #000;
  font-family: system-ui, -apple-system, sans-serif;
`;

const Content = styled.div`
  text-align: center;
`;

const Big404 = styled(motion.h1)`
  font-size: 220px;
  font-weight: 900;
  margin: 0;
  line-height: 1;
  letter-spacing: -6px;
`;

const Divider = styled.div`
  width: 100px;
  height: 3px;
  background: black;
  margin: 30px auto;
`;

const Title = styled(motion.h2)`
  font-size: 42px;
  margin-bottom: 10px;
`;

const Text = styled(motion.p)`
  font-size: 18px;
  color: #666;
  margin-bottom: 40px;
`;

const Buttons = styled(motion.div)`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

const Button = styled(Link)`
  padding: 14px 28px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 16px;
  transition: all 0.3s ease;
`;

const PrimaryBtn = styled(Button)`
  background: black;
  color: white;

  &:hover {
    background: #222;
    transform: scale(1.08);
  }
`;

const SecondaryBtn = styled(Button)`
  border: 1px solid black;
  color: black;

  &:hover {
    background: black;
    color: white;
    transform: scale(1.08);
  }
`;

/* 🔥 компонент */
export function NotFoundPage() {
    return (
        <Container>
            <Content>

                {/* 404 */}
                <Big404
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.7 }}
                >
                    404
                </Big404>

                {/* линия */}
                <Divider />

                {/* заголовок */}
                <Title
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Page not found
                </Title>

                {/* текст */}
                <Text
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    The page you’re looking for doesn’t exist or was moved.
                </Text>

                {/* кнопки */}
                <Buttons
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <PrimaryBtn to="/timesheet">
                        Home
                    </PrimaryBtn>


                </Buttons>

            </Content>
        </Container>
    );
}