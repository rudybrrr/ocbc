export default function Page() {
  return (
    <div className="device-preview">
      <div className="device">
        <span className="device-buttons" aria-hidden="true" />
        <div className="device-screen">
          <span className="device-island" aria-hidden="true" />
          <iframe
            src="/mobile"
            title="OCBC Adaptive Assist mobile app"
            allow="microphone"
          />
          <span className="device-home" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
