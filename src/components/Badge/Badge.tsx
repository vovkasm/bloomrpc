import * as React from 'react';


interface BadgeProps {
  type: "protoFile" | "service" | "method"
  children: Node | string | Element
}

export function Badge({ type, children }: BadgeProps) {

  return (
    <div style={{
      ...styles.badge,
      ...styles[type]
    }}>{children}</div>
  )
}

const styles = {
  badge: {
    fontSize: "11px",
    aspectRatio: "1/1",
    height: '15px',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    marginRight: '0.3em',
  },
  protoFile: {
    backgroundColor: "#15abff",
    color: "#fff"
  },
  service: {
    backgroundColor: "#ffa733",
    color: "#fff",
  },
  method: {
    backgroundColor: "#2cc316",
    color: "#fff",
  },
} as const;