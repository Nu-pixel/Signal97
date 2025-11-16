import React from "react";
import { motion } from "framer-motion";
import { Clock, Layout, ShieldCheck } from "lucide-react";

const audience = [
  {
    icon: Clock,
    title: "Limited time",
    description:
      "You can't sit at a screen all day. You want a few serious alerts, not a firehose.",
  },
  {
    icon: Layout,
    title: "Structure over noise",
    description:
      "You prefer clear rules, clean layouts, and real tracking instead of hype.",
  },
  {
    icon: ShieldCheck,
    title: "Risk-aware",
    description:
      "You know there are no guarantees. You just want a smarter way to participate.",
  },
];

export default function WhoItsFor() {
  return (
    <section
      id="who"
      className="py-24 px-6 bg-[#187bcd]"  // <- your blue
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built for people with a life
          </h2>
          {/* optional supporting line */}
          {/* <p className="text-sm md:text-base text-blue-50 max-w-xl mx-auto">
            Signal 97 is designed for real schedules, real capital, and real
            limits—not full-time screens.
          </p> */}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {audience.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="
                bg-white
                rounded-2xl p-8
                shadow-xl
                border border-white/40
                hover:shadow-2xl
                transition-all
              "
            >
              <div
                className="
                  bg-gradient-to-br
                  from-blue-50 to-blue-100
                  text-blue-600
                  w-16 h-16
                  rounded-2xl
                  flex items-center justify-center
                  mb-6
                "
              >
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
