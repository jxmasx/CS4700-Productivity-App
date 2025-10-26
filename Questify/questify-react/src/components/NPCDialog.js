import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NPCDialog({
  text,
  visible,
  onNext,
  avatarSrc = "/sprites/npc_registrar.png",
  avatarAlt = "Guild Registrar",
  name = "Registrar",
  side = "left",
  variant = "bar" 
}) {
  const container = {
    initial: { opacity: 0, y: variant === "bar" ? 40 : 0, scale: variant === "modal" ? 0.94 : 1 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: variant === "bar" ? 40 : 0, scale: variant === "modal" ? 0.98 : 1 },
    transition: { duration: 0.35 }
  };

  const content = (
    <motion.div
      key="npc-dialog"
      {...container}
      style={{
        background: "rgba(255, 249, 235, .98)",
        border: "3px solid #3f220e",
        borderRadius: 16,
        boxShadow: "0 12px 30px rgba(0,0,0,.35)",
        color: "#2f241a",
        fontFamily: "Poppins, system-ui, sans-serif",
        width: variant === "modal" ? "min(760px, 95vw)" : "min(92vw, 680px)",
        padding: variant === "modal" ? "18px 20px" : "14px 16px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            variant === "modal"
              ? (side === "left" ? "120px 1fr" : "1fr 120px")
              : (side === "left" ? "88px 1fr" : "1fr 88px"),
          gap: 16,
          alignItems: "center",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            order: side === "left" ? 0 : 2,
            display: "grid",
            placeItems: "center",
          }}
        >
          <motion.img
            src={avatarSrc}
            alt={avatarAlt}
            width={variant === "modal" ? 104 : 72}
            height={variant === "modal" ? 104 : 72}
            style={{
              imageRendering: "pixelated",
              borderRadius: 12,
              background: "#f4e9d4",
              border: "2px solid #3f220e",
              padding: 6,
            }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            style={{
              marginTop: 6,
              fontWeight: 700,
              fontSize: 12,
              color: "#3f220e",
              opacity: 0.8,
            }}
          >
            {name}
          </div>
        </div>

        {/* Text + button */}
        <div style={{ order: 1 }}>
          <p style={{ margin: 0, fontSize: variant === "modal" ? "1.15rem" : "1.05rem", lineHeight: 1.55 }}>
            {text}
          </p>
          {onNext && (
            <button
              onClick={onNext}
              style={{
                marginTop: 12,
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "10px 18px",
                cursor: "pointer",
                fontWeight: 700,
                float: "right",
                boxShadow: "0 8px 18px rgba(0,0,0,.25)",
              }}
            >
              Continue ➜
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          {variant === "modal" && (
            <motion.div
              key="npc-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "fixed",
                inset: 0,
                background: "#000",
                zIndex: 9998,
              }}
            />
          )}
          <div
            style={{
              position: "fixed",
              zIndex: 9999,
              bottom: variant === "bar" ? "2rem" : "auto",
              left: "50%",
              transform: "translateX(-50%)",
              top: variant === "modal" ? "50%" : "auto",
              ...(variant === "modal" ? { transform: "translate(-50%,-50%)" } : {}),
            }}
          >
            {content}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
