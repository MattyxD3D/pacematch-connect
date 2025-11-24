import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface MessageModalProps {
  show: boolean;
  userName: string;
  onClose: () => void;
  onSend: (message: string, isTemplate: boolean) => void;
}

const TEMPLATE_MESSAGES = [
  {
    id: 1,
    text: "Hi! Want to workout together?",
    emoji: "💬",
  },
  {
    id: 2,
    text: "Great to see another runner nearby!",
    emoji: "💬",
  },
  {
    id: 3,
    text: "Would you like to join me for a run?",
    emoji: "💬",
  },
  {
    id: 4,
    text: "Nice to meet you! Let's connect.",
    emoji: "💬",
  },
];

export const MessageModal = ({ show, userName, onClose, onSend }: MessageModalProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const maxLength = 500;
  const messageToSend = selectedTemplate 
    ? TEMPLATE_MESSAGES.find(t => t.id === selectedTemplate)?.text || ""
    : customMessage;
  const canSend = messageToSend.trim().length > 0 && !isSending;

  const handleTemplateClick = (templateId: number) => {
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null);
    } else {
      setSelectedTemplate(templateId);
      setCustomMessage(""); // Clear custom message when template selected
    }
  };

  const handleCustomMessageChange = (value: string) => {
    if (value.length <= maxLength) {
      setCustomMessage(value);
      setSelectedTemplate(null); // Clear template when typing
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    
    setIsSending(true);
    
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSend(messageToSend, selectedTemplate !== null);
    
    // Reset state
    setSelectedTemplate(null);
    setCustomMessage("");
    setIsSending(false);
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setCustomMessage("");
    setIsSending(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-elevation-4 max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <ChatBubbleOutlineIcon className="text-primary" />
                <h2 className="text-lg font-bold">Send Message to {userName}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-full"
              >
                <CloseIcon />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)] space-y-4">
              {/* Quick Messages Section */}
              <div>
                <p className="text-sm font-semibold mb-3 text-muted-foreground">Quick Messages:</p>
                <div className="space-y-2">
                  {TEMPLATE_MESSAGES.map((template) => (
                    <motion.button
                      key={template.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTemplateClick(template.id)}
                      className={`
                        w-full p-4 rounded-xl text-left transition-all duration-200
                        border-2 min-h-[56px] touch-target relative
                        ${selectedTemplate === template.id
                          ? "border-primary bg-primary/10 shadow-elevation-2"
                          : "border-border bg-card hover:bg-secondary"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{template.emoji}</span>
                        <p className={`text-sm font-medium flex-1 ${selectedTemplate === template.id ? "text-foreground" : "text-foreground/80"}`}>
                          {template.text}
                        </p>
                        {selectedTemplate === template.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            <CheckCircleIcon className="text-primary" fontSize="small" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Message Section */}
              <div>
                <p className="text-sm font-semibold mb-2 text-muted-foreground">Or write your own:</p>
                <div className="relative">
                  <Textarea
                    value={customMessage}
                    onChange={(e) => handleCustomMessageChange(e.target.value)}
                    placeholder="Type your message..."
                    className={`
                      min-h-[100px] resize-none text-sm
                      ${customMessage.length > 0 ? "border-primary border-2" : ""}
                    `}
                  />
                  <p className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {customMessage.length}/{maxLength}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card sticky bottom-0">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 text-base font-semibold"
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!canSend}
                  className={`
                    flex-1 h-12 text-base font-semibold
                    bg-primary text-primary-foreground hover:bg-primary/90
                    ${canSend && !isSending ? "animate-pulse-slow" : ""}
                  `}
                >
                  {isSending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <ChatBubbleOutlineIcon />
                    </motion.div>
                  ) : (
                    <>
                      <ChatBubbleOutlineIcon className="mr-2" fontSize="small" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
