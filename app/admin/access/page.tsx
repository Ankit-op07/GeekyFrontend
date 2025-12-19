'use client';

import { useState } from 'react';

const courses = [
    'JS Interview Preparation Kit',
    'Complete Frontend Interview Preparation Kit',
    'Frontend Interview Experiences Kit',
    'Reactjs Interview Preparation Kit',
    'Node.js Interview Preparation Kit',
];

export default function AdminAccessPage() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [course, setCourse] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/grant-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, phone, course }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                setEmail('');
                setPhone('');
                setCourse('');
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to connect to server' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '40px',
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                <h1 style={{
                    margin: '0 0 10px 0',
                    fontSize: '24px',
                    color: '#333',
                    textAlign: 'center',
                }}>
                    🔐 Admin Access
                </h1>
                <p style={{
                    margin: '0 0 30px 0',
                    color: '#666',
                    textAlign: 'center',
                    fontSize: '14px',
                }}>
                    Grant course access to users
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                            Email Address *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="user@example.com"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '2px solid #e0e0e0',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 9876543210"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '2px solid #e0e0e0',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                            Select Course *
                        </label>
                        <select
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '2px solid #e0e0e0',
                                fontSize: '14px',
                                outline: 'none',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                            }}
                        >
                            <option value="">-- Select a course --</option>
                            {courses.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '8px',
                            border: 'none',
                            background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                    >
                        {loading ? '⏳ Granting Access...' : '🚀 Grant Access & Send Email'}
                    </button>
                </form>

                {message && (
                    <div style={{
                        marginTop: '20px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                        color: message.type === 'success' ? '#155724' : '#721c24',
                        fontSize: '14px',
                        textAlign: 'center',
                    }}>
                        {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
