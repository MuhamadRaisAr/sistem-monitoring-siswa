import { useState, useEffect } from 'react';

// Helper function to convert base64 to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const useWebPush = (token) => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [permissionState, setPermissionState] = useState(typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default');

    const subscribeToPush = async () => {
        if (!token) return false;
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                // Register service worker
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered with scope:', registration.scope);

                // Ask for permission (this must be triggered by a user click!)
                const permission = await Notification.requestPermission();
                setPermissionState(permission);
                
                if (permission !== 'granted') {
                    console.warn('Notification permission denied.');
                    alert('Izin notifikasi ditolak. Silakan izinkan di pengaturan browser Anda.');
                    return false;
                }


                    // Get VAPID public key from backend
                    const vapidRes = await fetch('/api/push/vapidPublicKey', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!vapidRes.ok) {
                        const errorText = await vapidRes.text();
                        throw new Error(`Failed to fetch VAPID key: ${errorText}`);
                    }
                    const { publicKey } = await vapidRes.json();
                    if (!publicKey) throw new Error('No public key from server');

                    // Subscribe to push manager
                    const convertedVapidKey = urlBase64ToUint8Array(publicKey);
                    let pushSubscription = await registration.pushManager.getSubscription();

                    if (!pushSubscription) {
                        pushSubscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: convertedVapidKey
                        });
                    }

                    // Send subscription to backend
                    await fetch('/api/push/subscribe', {
                        method: 'POST',
                        body: JSON.stringify({ subscription: pushSubscription }),
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                setIsSubscribed(true);
                setSubscription(pushSubscription);
                console.log('User is subscribed to Web Push');
                return true;
            } catch (error) {
                console.error('Failed to subscribe user to Web Push:', error);
                alert(`Gagal mengaktifkan notifikasi: ${error.message}`);
                return false;
            }
        } else {
            alert("Perangkat atau Browser Anda tidak mendukung Web Push Notification (Mungkin karena diakses via HTTP IP lokal tanpa HTTPS).");
        }
        return false;
    };

    const unsubscribeFromPush = async () => {
        if (!token) return false;
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const pushSubscription = await registration.pushManager.getSubscription();
                
                if (pushSubscription) {
                    await pushSubscription.unsubscribe();
                    
                    await fetch('/api/push/unsubscribe', {
                        method: 'POST',
                        body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
                
                setIsSubscribed(false);
                setSubscription(null);
                console.log('User is unsubscribed from Web Push');
                return true;
            } catch (error) {
                console.error('Failed to unsubscribe from Web Push:', error);
                return false;
            }
        }
        return false;
    };

    useEffect(() => {
        // Only auto-subscribe on load if permission was already granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            subscribeToPush();
        }
    }, [token]);

    return { isSubscribed, subscription, permissionState, subscribeToPush, unsubscribeFromPush };
};
