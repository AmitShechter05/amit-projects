/**
 * אייקון עגלה לכפתורי "הוספה לעגלה" (עמית, 12.11.2026: "אימוג'י של עגלה,
 * בלי מחיר"). ציור ולא אימוג'י, כדי שייראה זהה בכל טלפון ויקבל את צבע
 * הטקסט של הכפתור.
 */
export default function CartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path
        d="M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.1h8.3a1.5 1.5 0 0 0 1.4-1.1L20.5 8H6.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19.5" r="1.4" fill="currentColor" />
      <circle cx="17" cy="19.5" r="1.4" fill="currentColor" />
    </svg>
  );
}
