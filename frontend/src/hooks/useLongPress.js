import { useRef, useCallback } from 'react';

export const useLongPress = (onLongPress, onClick, { shouldPreventDefault = true, delay = 2000 } = {}) => {
    const timeout = useRef();
    const target = useRef();

    const start = useCallback(
        (event, context) => {
            if (shouldPreventDefault && event.target) {
                event.target.addEventListener('touchend', preventDefault, {
                    passive: false
                });
                target.current = event.target;
            }
            if (event.type === 'mousedown' && event.button !== 0) return; // Only left click for mouse
            
            timeout.current = setTimeout(() => {
                onLongPress(event, context);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault]
    );

    const clear = useCallback(
        (event, context) => {
            if (timeout.current) {
                clearTimeout(timeout.current);
                timeout.current = undefined;
                if (onClick && event.type !== 'mouseleave' && event.type !== 'touchcancel' && event.type !== 'touchmove') {
                    onClick(event, context);
                }
            }
            if (shouldPreventDefault && target.current) {
                target.current.removeEventListener('touchend', preventDefault);
            }
        },
        [shouldPreventDefault, onClick]
    );

    return (context) => ({
        onMouseDown: e => start(e, context),
        onTouchStart: e => start(e, context),
        onMouseUp: e => clear(e, context),
        onMouseLeave: e => clear(e, context),
        onTouchEnd: e => clear(e, context),
        onTouchMove: e => clear(e, context),
        onTouchCancel: e => clear(e, context),
        onContextMenu: e => {
            e.preventDefault();
            onLongPress(e, context);
        }
    });
};

const isTouchEvent = event => {
    return 'touches' in event;
};

const preventDefault = event => {
    if (!isTouchEvent(event)) return;

    if (event.touches.length < 2 && event.preventDefault) {
        event.preventDefault();
    }
};
