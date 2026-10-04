/** Design tokens for programmatic use (mirrors tokens.css). */
export const tokens = {
  color: {
    primary: '#1a7f4b',
    primaryHover: '#13643c',
    primarySoft: '#e7f6ee',
    rating: '#f5a623',
    danger: '#d64545',
    warning: '#e8871e',
    success: '#1a8f55',
    info: '#2f6fed',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    pill: '999px',
  },
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
} as const;