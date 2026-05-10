import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, X, Zap, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const isScanningRef = useRef(false) // Lock to prevent multiple scans
  const [error, setError] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [lastScan, setLastScan] = useState(null)

  useEffect(() => {
    const html5QrCode = new Html5Qrcode('qr-reader')
    scannerRef.current = html5QrCode

    const startScanner = async () => {
      try {
        const config = {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const width = Math.min(viewfinderWidth * 0.85, 400);
            const height = Math.min(viewfinderHeight * 0.45, 200);
            return { width, height };
          },
          aspectRatio: 1.777778,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        }

        const formats = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ]

        await html5QrCode.start(
          { facingMode: 'environment' },
          { ...config, formatsToSupport: formats },
          (decodedText) => {
            // Check lock to prevent multiple triggers
            if (!isScanningRef.current) {
              isScanningRef.current = true; // Set lock
              setLastScan(decodedText);
              toast.success(`Detected: ${decodedText}`, { id: 'scan-success' });
              
              // Call onScan immediately
              onScan(decodedText);
              
              // We don't need to manually stop here because the component 
              // will be unmounted by the parent (BillingPage)
            }
          },
          () => {
            // Error callback - ignore noise
          }
        )
        setIsInitializing(false)
      } catch (err) {
        console.error('Scanner Error:', err)
        setError('Camera access denied. Please check permissions.')
        setIsInitializing(false)
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop()
            .then(() => {
              scannerRef.current.clear()
            })
            .catch((err) => console.error('Cleanup error:', err))
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array ensures this only runs once on mount

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box w-full max-w-md overflow-hidden bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 border border-emerald-400/20">
              <Camera size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Advanced Scanner</h3>
              <p className="text-xs text-slate-400">One-time scan protection enabled</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="p-6">
          <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 transition-all duration-300 ${
            error ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-500/30 bg-emerald-500/10'
          }`}>
            {isInitializing ? (
              <Loader2 size={20} className="animate-spin text-emerald-400" />
            ) : error ? (
              <AlertCircle size={20} className="text-rose-400" />
            ) : lastScan ? (
              <CheckCircle2 size={20} className="text-emerald-400 animate-pulse" />
            ) : (
              <Zap size={20} className="animate-pulse text-emerald-400" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-bold ${error ? 'text-rose-200' : 'text-emerald-200'}`}>
                {isInitializing ? 'Activating Camera' : error ? 'Camera Error' : lastScan ? 'Success!' : 'Ready to Scan'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isInitializing ? 'Checking sensors...' : error || (lastScan ? `Scanned: ${lastScan}` : 'Align barcode in the center')}
              </p>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-inner">
            <div id="qr-reader" className="h-full w-full" />
            
            {!isInitializing && !error && !lastScan && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div className="relative h-1/2 w-full max-w-[320px] rounded-2xl border-2 border-emerald-400/40 bg-emerald-400/5 shadow-[0_0_30px_rgba(52,211,153,0.15)]">
                  <div className="absolute -left-1 -top-1 h-4 w-4 border-l-2 border-t-2 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -right-1 -top-1 h-4 w-4 border-r-2 border-t-2 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -left-1 -bottom-1 h-4 w-4 border-l-2 border-b-2 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -right-1 -bottom-1 h-4 w-4 border-r-2 border-b-2 border-emerald-400 rounded-br-lg" />
                  <div className="absolute left-0 top-0 h-0.5 w-full animate-scan-line bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
              Retail Grade Detection Enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



