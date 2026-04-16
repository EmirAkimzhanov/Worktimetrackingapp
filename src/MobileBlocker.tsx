// MobileBlocker.tsx
import React, { useEffect, useState } from 'react';

const MobileBlocker: React.FC = () => {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '20px',
                textAlign: 'center',
                maxWidth: '90%',
                width: '400px'
            }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>
                    🖥️
                </div>

                <h1 style={{ fontSize: '28px', marginBottom: '16px', color: '#333' }}>
                    Desktop Version Only
                </h1>

                <p style={{ fontSize: '16px', marginBottom: '12px', color: '#666' }}>
                    <strong>This application is optimized for desktop devices</strong>
                </p>

                <p style={{ fontSize: '16px', marginBottom: '12px', color: '#666' }}>
                    Please open this page on a computer or tablet
                </p>

                <p style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '20px' }}>
                    ⚠️ Mobile access is restricted ⚠️
                </p>

                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f5f5f5',
                    borderRadius: '10px'
                }}>
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        📏 Minimum screen width: <strong>768px</strong>
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        📱 Your screen width: <strong>{screenWidth}px</strong>
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        💡 Please use a desktop computer
                    </p>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    style={{
                        marginTop: '20px',
                        padding: '12px 24px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'background 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#5a67d8';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#667eea';
                    }}
                >
                    Refresh Page
                </button>
            </div>
        </div>
    );
};

export default MobileBlocker;