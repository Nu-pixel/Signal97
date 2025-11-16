"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How are alerts generated?",
    answer: "Using a defined, rules-based framework grounded in price behavior and historical tendencies. We do not rely on rumors or social media. Specific formulas stay internal."
  },
  {
    question: "Do you auto-trade for me or touch my money?",
    answer: "No. You place trades through your own broker. Signal 97 never holds funds or executes trades on your behalf."
  },
  {
    question: "Can I see the full model?",
    answer: "We share clear explanations and performance views, but not the exact internal logic. This protects the integrity of the system and your edge."
  },
  {
    question: "Is Signal 97 right for me?",
    answer: "It's for people who want help with structure and tracking. It does not remove risk, and it's not a get-rich-quick tool."
  },
  {
    question: "What did your historical testing show?",
    answer: "In a two-year historical backtest of our rules-based alerts, approximately 88.9% of qualifying signals reached at least +4% within 0–7 days. When limited to stocks priced above $3, that figure was approximately 92.3%. These results are hypothetical and based on historical data only. Past performance does not guarantee future results, and real trading outcomes will differ."
  },
  {
    question: "What about risk?",
    answer: "Trading stocks and options involves real risk, including the loss of your entire investment. Use Signal 97 as one tool in your process, not as a guarantee."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="results" className="py-24 px-6 bg-white/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Questions, results & safety
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 text-lg pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}