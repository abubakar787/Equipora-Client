
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Headset } from "lucide-react";

// Replace with the real WhatsApp number in international format.
// Example: 8801XXXXXXXXX (without + or spaces).
const WHATSAPP_NUMBER = "";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const openWhatsApp = () => {
    if (!WHATSAPP_NUMBER) return;

    const message = encodeURIComponent(
      "Hello EQUIPORA Support! I need help with equipment rental."
    );

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="fixed bottom-6 right-5 z-[100] sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[min(340px,calc(100vw-40px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-[#075E54] p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <Headset className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">EQUIPORA Support</p>
                  <p className="text-xs text-emerald-100">
                    We are here to help
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-2 transition hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-[#F0F2F5] p-4">
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm">
                Hello! Welcome to EQUIPORA.
                <br />
                Need help finding or renting equipment? Our support team is
                ready to help.
              </div>

              <button
                type="button"
                onClick={openWhatsApp}
                disabled={!WHATSAPP_NUMBER}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1DA851] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                {WHATSAPP_NUMBER ? "Chat on WhatsApp" : "WhatsApp number coming soon"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
        aria-expanded={isOpen}
        className="relative ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-green-900/25 ring-4 ring-white"
      >
        {!isOpen && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-25" />
        )}
        {isOpen ? (
          <X className="relative h-6 w-6" />
        ) : (
          <MessageCircle className="relative h-7 w-7" />
        )}
      </motion.button>
    </div>
  );
}
