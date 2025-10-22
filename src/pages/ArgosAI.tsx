import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, MessageSquare, X, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ArgosAI = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    }
  }, [userEmail, companyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: '¡Hola! Soy **ArgosAI**, tu asistente inteligente de análisis de datos. Pregúntame sobre las menciones, el sentimiento, las fuentes o cualquier estadística del sistema de monitorización.',
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const fetchCompanyId = async () => {
    try {
      const response = await apiFetch(`/api/info/getIdEmpresa?email=${userEmail}`);
      if (!response.ok) throw new Error('Error al obtener ID de empresa');

      const result = await response.json();
      setCompanyId(result.data.company_id.toString());
    } catch (error) {
      toast.error('Error al cargar información de empresa');
      console.error(error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !companyId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          company_id: parseInt(companyId)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error('Error al obtener respuesta');
      }

      const result = await response.json();
      console.log('Respuesta completa del servidor:', result);
      
      const answerText = result.data?.answer || result.answer || 'Lo siento, no pude procesar tu pregunta.';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answerText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      console.log('Respuesta de ArgosAI:', answerText);
    } catch (error) {
      console.error('Error completo:', error);
      toast.error('Error al comunicarse con ArgosAI');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    const formatted: string[] = [];
    let inList = false;
    
    lines.forEach((line, i) => {
      let trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        formatted.push('<div class=\'mb-2\'></div>');
        return;
      }
      
      // Headers
      if (trimmedLine.startsWith('### ')) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        const text = trimmedLine.substring(4);
        formatted.push('<h3 class=\'text-base sm:text-lg font-bold text-cyan-300 mt-4 mb-2\'>' + text + '</h3>');
        return;
      }
      
      if (trimmedLine.startsWith('## ')) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        const text = trimmedLine.substring(3);
        formatted.push('<h2 class=\'text-lg sm:text-xl font-bold text-cyan-300 mt-4 mb-2\'>' + text + '</h2>');
        return;
      }
      
      if (trimmedLine.startsWith('# ')) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        const text = trimmedLine.substring(2);
        formatted.push('<h1 class=\'text-xl sm:text-2xl font-bold text-cyan-300 mt-4 mb-2\'>' + text + '</h1>');
        return;
      }
      
      // Bold text
      let processedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong class=\'text-cyan-300 font-semibold\'>$1</strong>');
      
      // Italic text (solo si no es parte de bold)
      processedLine = processedLine.replace(/\*([^*]+)\*/g, '<em class=\'text-white/80 italic\'>$1</em>');
      
      // Inline code
      processedLine = processedLine.replace(/`([^`]+)`/g, '<code class=\'bg-cyan-900/30 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono\'>$1</code>');
      
      // Bullet lists
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList) {
          formatted.push('<ul class=\'list-none space-y-1.5 my-2\'>');
          inList = true;
        }
        const text = processedLine.substring(2);
        formatted.push('<li class=\'flex gap-2 items-start\'><span class=\'text-cyan-400 shrink-0 mt-0.5\'>•</span><span>' + text + '</span></li>');
        return;
      }
      
      // Numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        const number = numberedMatch[1];
        const text = processedLine.replace(/^\d+\.\s+/, '');
        formatted.push('<div class=\'flex gap-2 my-1.5 items-start\'><span class=\'text-cyan-400 font-semibold shrink-0\'>' + number + '.</span><span>' + text + '</span></div>');
        return;
      }
      
      // Regular paragraph
      if (inList) {
        formatted.push('</ul>');
        inList = false;
      }
      
      formatted.push('<div class=\'mb-2 leading-relaxed\'>' + processedLine + '</div>');
    });
    
    // Close list if still open
    if (inList) {
      formatted.push('</ul>');
    }
    
    return formatted.join('');
  };

  return (
    <>
      <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/40 blur-xl sm:blur-2xl rounded-full animate-pulse"></div>
          
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 shadow-2xl border-2 border-cyan-400/50 transition-all duration-300 hover:scale-110 p-0 overflow-hidden"
          >
            <img 
              src="/assets/ArgosAI_logo.png" 
              alt="ArgosAI" 
              className="relative h-full w-full object-cover"
            />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed bottom-16 right-3 sm:bottom-24 sm:right-6 z-50 animate-fade-in">
          <div className="relative w-[calc(100vw-1.5rem)] sm:w-[400px] lg:w-[450px]">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-2xl rounded-3xl"></div>
            
            <div className="relative glass-effect rounded-2xl sm:rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col h-[50vh] sm:h-[600px]">
              <div className="p-3 sm:p-5 border-b border-white/10 bg-gradient-to-r from-cyan-600/10 to-purple-600/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500/30 blur-md sm:blur-lg rounded-full"></div>
                      <img 
                        src="/assets/ArgosAI_logo.png" 
                        alt="ArgosAI" 
                        className="relative h-8 w-8 sm:h-12 sm:w-12 rounded-full border border-cyan-400/50 sm:border-2 object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-xl font-bold text-white">ArgosAI</h3>
                      <p className="text-[10px] sm:text-xs text-white/60 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-400 rounded-full animate-pulse"></span>
                        Online
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-10 sm:w-10 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                    >
                      <Minimize2 className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    </Button>
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-10 sm:w-10 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-600/70 p-2.5 sm:p-4 space-y-2.5 sm:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-1.5 sm:gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    } animate-fade-in`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-sm sm:blur-md rounded-full"></div>
                        <img 
                          src="/assets/ArgosAI_logo.png" 
                          alt="ArgosAI" 
                          className="relative h-6 w-6 sm:h-8 sm:w-8 rounded-full border border-cyan-400/50 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-purple-500/20 blur-sm sm:blur-md rounded-full"></div>
                        <div className="relative h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-[10px] sm:text-sm border border-purple-400/50">
                          {userEmail?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                    )}

                    <div className={`flex-1 min-w-0 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div
                        className={`inline-block ${message.role === 'user' ? 'max-w-[85%]' : 'max-w-[95%]'} p-2.5 sm:p-4 rounded-xl sm:rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-purple-600/90 to-pink-600/90 text-white'
                            : 'glass-effect border border-cyan-400/20'
                        }`}
                      >
                        <div 
                          className={`text-[11px] sm:text-sm leading-relaxed ${
                            message.role === 'assistant' ? 'text-white/90' : 'text-white'
                          }`}
                          dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                        />
                        <div className={`text-[9px] sm:text-[10px] mt-1 ${
                          message.role === 'user' ? 'text-white/60' : 'text-white/40'
                        }`}>
                          {message.timestamp.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-1.5 sm:gap-3 animate-fade-in">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-cyan-500/20 blur-sm sm:blur-md rounded-full"></div>
                      <img 
                        src="/assets/ArgosAI_logo.png" 
                        alt="ArgosAI" 
                        className="relative h-6 w-6 sm:h-8 sm:w-8 rounded-full border border-cyan-400/50 object-cover"
                      />
                    </div>
                    <div className="glass-effect border border-cyan-400/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-cyan-400" />
                        <span className="text-[11px] sm:text-sm text-white/70">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-2.5 sm:p-4 border-t border-white/10 bg-gradient-to-r from-cyan-600/5 to-purple-600/5">
                <div className="flex gap-1.5 sm:gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 bg-white/5 border border-white/10 focus-visible:ring-1 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/50 text-white placeholder:text-white/40 text-xs sm:text-sm rounded-lg sm:rounded-xl h-9 sm:h-10"
                    disabled={isLoading || !companyId}
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim() || !companyId}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl px-2.5 sm:px-4 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shrink-0 h-9 w-9 sm:h-10 sm:w-auto"
                    size="icon"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
                
                <p className="text-[9px] sm:text-[10px] text-white/40 mt-1.5 sm:mt-2 text-center flex items-center justify-center gap-1">
                  <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="hidden sm:inline">Pregunta sobre sentimiento, fuentes, menciones...</span>
                  <span className="sm:hidden">Pregunta sobre tus datos...</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArgosAI;