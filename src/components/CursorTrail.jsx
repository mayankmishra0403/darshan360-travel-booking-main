import React, { useEffect, useRef, useState } from 'react';
import dLogo from '../pages/d.jpg';

const NUM_TRAILS = 18;
const TRAIL_SIZE = 36;



const CursorTrail = () => {
  const trailRefs = useRef([]);
  const positions = useRef(Array.from({ length: NUM_TRAILS }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  })));
  const [visible, setVisible] = useState(false);
  const hideTimeout = useRef();

  useEffect(() => {
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let animation;

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      setVisible(true);
      clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => setVisible(false), 900);
    };
    window.addEventListener('mousemove', onMove);

    function animate() {
      let prev = { ...mouse };
      for (let i = 0; i < NUM_TRAILS; i++) {
        const pos = positions.current[i];
        // Lerp towards previous (no random offset for smoothness)
        pos.x += (prev.x - pos.x) * 0.22;
        pos.y += (prev.y - pos.y) * 0.22;
        prev = pos;
        const el = trailRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${pos.x - TRAIL_SIZE / 2}px, ${pos.y - TRAIL_SIZE / 2}px, 0) scale(${1 - i * 0.04})`;
          el.style.opacity = visible ? `${1 - i * 0.045}` : '0';
          el.style.transition = visible ? 'opacity 0.15s, transform 0.08s' : 'opacity 0.4s';
        }
      }
      animation = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animation);
      clearTimeout(hideTimeout.current);
    };
  }, [visible]);
  return (
    <>
      {Array.from({ length: NUM_TRAILS }).map((_, i) => (
        <img
          key={i}
          ref={el => (trailRefs.current[i] = el)}
          src={dLogo}
          alt="trail"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: TRAIL_SIZE,
            height: TRAIL_SIZE,
            pointerEvents: 'none',
            zIndex: 9999,
            filter: 'drop-shadow(0 0 12px #a78bfa) drop-shadow(0 0 24px #fbbf24)',
            willChange: 'transform, opacity',
            userSelect: 'none',
            opacity: 0,
          }}
        />
      ))}
    </>
  );
};

export default CursorTrail;
