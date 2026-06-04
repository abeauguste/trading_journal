import React, { useRef, useEffect } from 'react'

export default function UploadZone({ onUpload, uploading, uploadStatus, uploadDetail }) {
  const inputRef = useRef(null)

  // Reset file input when status returns to idle so the same file can be re-uploaded
  useEffect(() => {
    if (uploadStatus === 'idle' && inputRef.current) {
      inputRef.current.value = ''
    }
  }, [uploadStatus])

  const busy = uploading || uploadStatus === 'parsing' || uploadStatus === 'posting'

  const btnLabel =
    uploadStatus === 'parsing' ? 'Parsing…'
  : uploadStatus === 'posting' ? 'Importing…'
  : '↑ Import Trades'

  const statusText =
    uploadStatus === 'done'  ? (uploadDetail || 'Import complete')
  : uploadStatus === 'error' ? (uploadDetail || 'Import failed')
  : ''

  const statusColor =
    uploadStatus === 'done'  ? 'var(--bull)'
  : uploadStatus === 'error' ? 'var(--bear)'
  : 'var(--text-3)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        multiple
        hidden
        onChange={(e) => onUpload(e.target.files)}
      />

      <button
        className="btn btn-primary"
        style={{ opacity: busy ? 0.65 : 1, cursor: busy ? 'not-allowed' : 'default' }}
        disabled={busy}
        onClick={() => !busy && inputRef.current?.click()}
      >
        {btnLabel}
      </button>

      {statusText && (
        <span style={{ fontSize: '12px', color: statusColor, fontFamily: 'var(--f-mono)' }}>
          {statusText}
        </span>
      )}

      <span style={{
        fontSize: '11px', color: 'var(--text-3)',
        marginLeft: 'auto',
      }}>
        Schwab · TOS · IBKR · AA-clean
      </span>
    </div>
  )
}
