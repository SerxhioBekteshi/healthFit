import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/Button';
import { t } from '@/i18n';

interface QrScannerProps {
  onDecoded: (value: string) => void;
  onError?: (message: string) => void;
}

const SCANNER_ELEMENT_ID = 'gym-qr-scanner';

export const QrScanner: React.FC<QrScannerProps> = ({ onDecoded, onError }) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async (): Promise<void> => {
    const scanner = scannerRef.current;
    if (!scanner) {
      return;
    }
    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // ignore stop errors when scanner is already stopped
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const scannerRefCurrent = scannerRef;
    return () => {
      const scanner = scannerRefCurrent.current;
      if (!scanner) {
        return;
      }
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => undefined);
      scannerRefCurrent.current = null;
    };
  }, []);

  const startScanner = async (): Promise<void> => {
    if (isScanning) {
      return;
    }
    setStatusMessage('');
    const element = document.getElementById(SCANNER_ELEMENT_ID);
    if (!element) {
      setStatusMessage(t('Scanner element not ready.'));
      return;
    }

    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      setIsScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onDecoded(decodedText.trim());
          stopScanner();
        },
        () => {
          // per-frame decode failures are noisy; ignore
        }
      );
    } catch (startError) {
      const message =
        startError instanceof Error
          ? startError.message
          : t('Camera access was denied or unavailable.');
      setStatusMessage(message);
      onError?.(message);
      await stopScanner();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!isScanning ? (
          <Button
            size="sm"
            variant="secondary"
            icon="scan"
            onClick={startScanner}
          >
            {t('Start camera scan')}
          </Button>
        ) : (
          <Button size="sm" variant="danger" onClick={stopScanner}>
            {t('Stop camera')}
          </Button>
        )}
        {statusMessage ? (
          <span className="text-xs text-danger">{statusMessage}</span>
        ) : null}
      </div>
      <div
        id={SCANNER_ELEMENT_ID}
        className={
          isScanning
            ? 'w-full max-w-sm overflow-hidden rounded-xl border border-white/10'
            : 'hidden'
        }
      />
    </div>
  );
};
