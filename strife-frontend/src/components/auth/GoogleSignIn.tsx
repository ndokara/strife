import React, { useEffect } from 'react';
import { authApi } from '@/api/parts/auth.ts';

type Props = {
  clientId: string;
  onSuccess?: (user: any) => void;
  onError?: (err: any) => void;
};

const GoogleSignIn: React.FC<Props> = ({ clientId, onSuccess, onError }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      if (window.google && window.google.accounts && window.google.accounts.id) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // @ts-ignore
        window.google.accounts.id.renderButton(
          document.getElementById('g_id_signin'),
          {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'continue_with',
            logo_alignment: 'left',
          }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [clientId]);

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      const result = await authApi.google(response.credential);

      if (onSuccess) onSuccess(result);
    } catch (err) {
      if (onError) onError(err);
    }
  };

  return <div id="g_id_signin"></div>;
};

export default GoogleSignIn;
