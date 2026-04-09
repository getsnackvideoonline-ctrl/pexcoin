import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { getToken } from "@/lib/auth-utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  messages?: Message[];
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiCall(path: string, method = "GET", body?: unknown) {
  const token = getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

function MessageBubble({ msg }: { msg: Message & { streaming?: boolean } }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        }`}
      >
        {msg.content}
        {(msg as any).streaming && (
          <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
}

export default function AiAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamContent]);

  async function loadConversations() {
    try {
      const res = await apiCall("/openai/conversations");
      const data: Conversation[] = await res.json();
      setConversations(data);
      if (data.length > 0 && !activeConvo) {
        await selectConversation(data[data.length - 1]);
      }
    } catch {
      // not logged in
    }
  }

  async function selectConversation(convo: Conversation) {
    setActiveConvo(convo);
    try {
      const res = await apiCall(`/openai/conversations/${convo.id}`);
      const data: Conversation = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  }

  async function createConversation() {
    const title = `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    try {
      const res = await apiCall("/openai/conversations", "POST", { title });
      const convo: Conversation = await res.json();
      setConversations((prev) => [...prev, convo]);
      setActiveConvo(convo);
      setMessages([]);
    } catch (err: any) {
      console.error(err);
    }
  }

  async function deleteConversation(convoId: number) {
    try {
      await apiCall(`/openai/conversations/${convoId}`, "DELETE");
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
      if (activeConvo?.id === convoId) {
        setActiveConvo(null);
        setMessages([]);
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !activeConvo || streaming) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const msgText = input.trim();
    setInput("");
    setStreaming(true);
    setStreamContent("");

    try {
      const token = getToken();
      const response = await fetch(
        `${BASE}/api/openai/conversations/${activeConvo.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: msgText }),
        }
      );

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                const assistantMsg: Message = {
                  id: Date.now() + 1,
                  role: "assistant",
                  content: accumulated,
                  createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
                setStreamContent("");
                setStreaming(false);
              } else if (data.content) {
                accumulated += data.content;
                setStreamContent(accumulated);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setStreaming(false);
      setStreamContent("");
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "What is Bitcoin's current market trend?",
    "Explain the difference between DCA and lump-sum investing",
    "What are the top altcoins to watch this month?",
    "How do I manage crypto portfolio risk?",
    "Explain what RSI means in crypto trading",
  ];

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex gap-4 h-[calc(100vh-160px)]">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-2">
            <Button onClick={createConversation} className="w-full gap-2" size="sm">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <ScrollArea className="flex-1 border rounded-lg p-2">
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Start a new conversation
                </p>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`group flex items-center justify-between gap-1 p-2 rounded-md cursor-pointer text-sm mb-1 transition-colors ${
                      activeConvo?.id === c.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/60"
                    }`}
                    onClick={() => selectConversation(c)}
                  >
                    <span className="truncate flex-1 text-xs">{c.title}</span>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(c.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                PexCoin AI Trading Assistant
                <Badge variant="secondary" className="text-xs ml-auto">Powered by GPT</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
              {!activeConvo ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to PexCoin AI</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Your intelligent crypto trading assistant. Ask me anything about markets,
                      strategies, technical analysis, or portfolio management.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        className="text-left text-sm p-3 border rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                        onClick={async () => {
                          await createConversation();
                          setInput(q);
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <Button onClick={createConversation} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Start a Conversation
                  </Button>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 && !streaming && (
                      <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                        <Bot className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Send a message to start chatting</p>
                        <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                          {suggestedQuestions.slice(0, 3).map((q) => (
                            <button
                              key={q}
                              className="text-xs px-3 py-1.5 border rounded-full hover:bg-muted/50 transition-colors text-muted-foreground"
                              onClick={() => setInput(q)}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    {streaming && streamContent && (
                      <MessageBubble
                        msg={{
                          id: -1,
                          role: "assistant",
                          content: streamContent,
                          createdAt: "",
                          streaming: true,
                        } as any}
                      />
                    )}
                    {streaming && !streamContent && (
                      <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </ScrollArea>

                  <div className="border-t p-4 flex gap-2 flex-shrink-0">
                    <Input
                      placeholder="Ask about crypto markets, trading strategies..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={streaming}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || streaming}
                      size="icon"
                    >
                      {streaming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
