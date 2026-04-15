import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Slide, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { useComparisonStore } from '../stores/comparisonStore';
import { getImageUrl } from '../api';

const ACCENT = '#1C2B4A';
const ORANGE = '#E85D04';
const GREEN = '#D4922A';
const TEXT = '#1A1814';
const MUTED = '#6B6156';

interface ProductSuggestion {
  id: number;
  name: string;
  slug: string;
  price: string;
  category: string;
  brand: string;
  image: string | null;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  products?: ProductSuggestion[];
}

// ── Product mini-card shown inline in bot messages ──────────────────────────
const ProductCard: React.FC<{ product: ProductSuggestion }> = ({ product }) => {
  const navigate = useNavigate();
  const imgSrc = product.image ? getImageUrl(product.image) : null;

  return (
    <Box
      onClick={() => navigate(`/product/${product.slug}`)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mt: 1,
        p: '10px 12px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '14px',
        border: `1px solid rgba(28,43,74,0.12)`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 20px rgba(232,93,4,0.15)`,
          borderColor: ORANGE,
        },
      }}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '10px',
          background: imgSrc ? 'transparent' : 'rgba(28,43,74,0.06)',
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imgSrc ? (
          <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ShoppingCartIcon sx={{ color: ACCENT, fontSize: 22, opacity: 0.4 }} />
        )}
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </Typography>
        {product.category && (
          <Typography sx={{ fontSize: 10, color: MUTED, mt: 0.2 }}>{product.brand || product.category}</Typography>
        )}
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: ORANGE, mt: 0.3 }}>₹{Number(product.price).toLocaleString('en-IN')}</Typography>
      </Box>

      {/* CTA */}
      <Box
        sx={{
          px: 1.5,
          py: 0.7,
          background: ACCENT,
          borderRadius: '8px',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>View →</Typography>
      </Box>
    </Box>
  );
};

// ── Main Widget ──────────────────────────────────────────────────────────────
export const ChatbotWidget = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items } = useComparisonStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today? Ask me about products, repairs, or anything TechVerse!',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'bot' ? 'model' : 'user',
        content: m.text,
      })).slice(-10);

      const response = await apiClient.post('/api/chat/', {
        message: userMsg.text,
        history,
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.reply,
        sender: 'bot',
        timestamp: new Date(),
        products: response.data.products || [],
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.error || error?.response?.data?.detail || error?.message || 'Unknown error';
      console.error('Chat API error:', status, detail);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: status === 429
          ? "I'm a bit busy right now! Please try again in a few minutes."
          : `Sorry, something went wrong (${status || 'network error'}). Please try again.`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: items.length > 0 ? (isMobile ? 100 : 110) : (isMobile ? 16 : 32),
        right: isMobile ? 16 : 32,
        zIndex: 11000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
        transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* ── CHAT WINDOW ── */}
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Box
          style={{
            pointerEvents: 'auto',
            marginBottom: isMobile ? 16 : 24,
            width: isMobile ? 'calc(100vw - 32px)' : 380,
            height: isMobile ? '70vh' : 600,
            maxHeight: isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 120px)',
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(26, 26, 26, 0.15)',
            borderRadius: 24,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              padding: '16px 20px',
              background: `linear-gradient(135deg, ${ACCENT} 0%, #2e4470 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                <SmartToyIcon sx={{ color: '#fff', fontSize: 18 }} />
              </Box>
              <Box>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>TechVerse AI</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  Online · Replies instantly
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* MESSAGE LIST */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              background: '#F7F8FA',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: '10px' },
            }}
          >
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Bubble row */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    {!isUser && (
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: ACCENT,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <SmartToyIcon sx={{ color: '#fff', fontSize: 13 }} />
                      </Box>
                    )}
                    <Box
                      sx={{
                        background: isUser ? `linear-gradient(135deg, ${ACCENT} 0%, #2e4470 100%)` : '#fff',
                        color: isUser ? '#fff' : TEXT,
                        padding: '10px 14px',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        border: isUser ? 'none' : '1px solid rgba(0,0,0,0.06)',
                        fontSize: 13.5,
                        lineHeight: 1.55,
                        boxShadow: isUser
                          ? `0 4px 12px rgba(28,43,74,0.25)`
                          : '0 1px 4px rgba(0,0,0,0.06)',
                      }}
                    >
                      {msg.text.split('\n').map((line, i, arr) => (
                        <React.Fragment key={i}>
                          {line}
                          {i !== arr.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </Box>
                  </Box>

                  {/* Product Cards (only for bot messages) */}
                  {!isUser && msg.products && msg.products.length > 0 && (
                    <Box sx={{ mt: 0.5, ml: 4.5, width: 'calc(100% - 36px)' }}>
                      {msg.products.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, alignSelf: 'flex-start' }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: ACCENT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <SmartToyIcon sx={{ color: '#fff', fontSize: 13 }} />
                </Box>
                <Box
                  sx={{
                    background: '#fff',
                    padding: '12px 16px',
                    borderRadius: '18px 18px 18px 4px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    gap: 0.7,
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <Box
                      key={i}
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: MUTED,
                        animation: 'typing-dot 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                        '@keyframes typing-dot': {
                          '0%, 60%, 100%': { opacity: 0.3, transform: 'scale(1)' },
                          '30%': { opacity: 1, transform: 'scale(1.2)' },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* INPUT AREA */}
          <Box
            sx={{
              p: '12px 16px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              background: '#fff',
              flexShrink: 0,
            }}
          >
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask in English, Hindi, or Marathi..."
                style={{
                  width: '100%',
                  background: '#F7F8FA',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 20,
                  padding: '12px 48px 12px 16px',
                  color: TEXT,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13.5,
                  outline: 'none',
                  resize: 'none',
                  height: 46,
                  overflow: 'hidden',
                  lineHeight: '22px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = ACCENT; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!inputValue.trim()}
                sx={{
                  position: 'absolute',
                  right: 6,
                  width: 34,
                  height: 34,
                  background: inputValue.trim() ? ACCENT : 'transparent',
                  color: inputValue.trim() ? '#fff' : MUTED,
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: inputValue.trim() ? '#2e4470' : 'transparent',
                  },
                  '&.Mui-disabled': { color: MUTED, background: 'transparent' },
                }}
              >
                <SendIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
            <Typography sx={{ textAlign: 'center', color: 'rgba(0,0,0,0.25)', fontSize: 10, mt: 1, fontWeight: 500 }}>
              AI can make mistakes. Verify important details.
            </Typography>
          </Box>
        </Box>
      </Slide>

      {/* ── FLOATING BUTTON ── */}
      <Box
        onClick={() => setIsOpen(!isOpen)}
        style={{
          pointerEvents: 'auto',
          width: isMobile ? 56 : 64,
          height: isMobile ? 56 : 64,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${ACCENT} 0%, #2e4470 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: `0 8px 24px rgba(28,43,74,0.4), inset 0 2px 0 rgba(255,255,255,0.2)`,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isOpen ? 'scale(0.9) rotate(90deg)' : 'scale(1) rotate(0deg)',
        }}
      >
        {isOpen ? (
          <CloseIcon sx={{ color: '#fff', fontSize: isMobile ? 24 : 28 }} />
        ) : (
          <ChatBubbleIcon sx={{ color: '#fff', fontSize: isMobile ? 24 : 28 }} />
        )}
      </Box>
    </Box>
  );
};
