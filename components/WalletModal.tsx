"use client";

import { useEffect } from "react";
import { WALLETS, WalletId, useWallet } from "./WalletProvider";

function WalletIcon({ id }: { id: WalletId }) {
  if (id === "metamask")
    return (
      <span className="wi" style={{ background: "#2a1a0c" }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="24" width="24" strokeWidth="0.25">
        <path fill="#e17726" d="M23.205225 0.9874275 13.121575 8.448625l1.87515 -4.397125 8.2085 -3.0640725Z" />
        <path fill="#e27625" d="M0.818115 0.996155 9.00465 4.052l1.780525 4.454775L0.818115 0.996155Z" />
        <path fill="#e27625" d="m19.147225 16.855225 4.4568 0.084825 -1.5576 5.291375 -5.438275 -1.49735 2.539075 -3.87885Z" />
        <path fill="#e27625" d="m4.852525 16.855225 2.529675 3.878875 -5.429175 1.497425 -1.5481175 -5.291475 4.4476175 -0.084825Z" />
        <path fill="#e27625" d="m10.543275 7.372 0.1822 5.882675 -5.450075 -0.247975 1.550225 -2.33875 0.019625 -0.02255L10.543275 7.372Z" />
        <path fill="#e27625" d="m13.4003 7.30645 3.75445 3.33925 0.019425 0.022375 1.550275 2.33875 -5.448825 0.247925 0.124675 -5.9483Z" />
        <path fill="#e27625" d="m7.541775 16.87225 2.9759 2.318675 -3.456875 1.669025 0.480975 -3.9877Z" />
        <path fill="#e27625" d="m16.458725 16.871875 0.471 3.988075 -3.447175 -1.669175 2.976175 -2.3189Z" />
        <path fill="#d5bfb2" d="m13.558475 18.9724 3.4981 1.69385 -3.253925 1.546475 0.033775 -1.022125 -0.27795 -2.2182Z" />
        <path fill="#d5bfb2" d="m10.44055 18.97315 -0.26705 2.2007 0.0219 1.037625 -3.26155 -1.54525 3.5067 -1.693075Z" />
        <path fill="#233447" d="m9.430425 14.02245 0.914125 1.921125 -3.11225 -0.911675 2.198125 -1.00945Z" />
        <path fill="#233447" d="m14.56965 14.02265 2.20845 1.009175 -3.12235 0.91145 0.9139 -1.920625Z" />
        <path fill="#cc6228" d="m7.779875 16.852725 -0.5031 4.1345 -2.696325 -4.044125 3.199425 -0.090375Z" />
        <path fill="#cc6228" d="m16.22045 16.852775 3.199525 0.0904L16.7135 20.9874l-0.49305 -4.134625Z" />
        <path fill="#cc6228" d="m18.803175 12.773 -2.328475 2.37305 -1.795225 -0.820375 -0.85955 1.8069 -0.56345 -3.1072 5.5467 -0.252375Z" />
        <path fill="#cc6228" d="m5.19555 12.77295 5.547675 0.2524 -0.563475 3.107225 -0.8597 -1.8067 -1.785775 0.8202 -2.338725 -2.373125Z" />
        <path fill="#e27525" d="m5.038825 12.286075 2.6344 2.6732 0.0913 2.63905 -2.7257 -5.31225Z" />
        <path fill="#e27525" d="M18.963975 12.28125 16.2334 17.603l0.1028 -2.643775L18.963975 12.28125Z" />
        <path fill="#e27525" d="m10.6146 12.448725 0.106025 0.667375 0.262 1.6625 -0.168425 5.10625 -0.79635 -4.1019 -0.000275 -0.0424 0.597025 -3.291825Z" />
        <path fill="#e27525" d="m13.384 12.439575 0.5986 3.301025 -0.00025 0.0424 -0.79835 4.11215 -0.0316 -1.028525 -0.124575 -4.1182 0.356175 -2.30885Z" />
        <path fill="#f5841f" d="m16.5705 14.8529 -0.08915 2.2929 -2.77905 2.16525 -0.5618 -0.39695 0.62975 -3.243675 2.80025 -0.817525Z" />
        <path fill="#f5841f" d="m7.439075 14.852975 2.790625 0.817525 0.629725 3.243625 -0.561825 0.396925 -2.7792 -2.165425 -0.079325 -2.29265Z" />
        <path fill="#c0ac9d" d="m6.4021 20.15985 3.555475 1.68465 -0.01505 -0.719375L10.24 20.864h3.51895l0.30825 0.26025 -0.0227 0.718875 3.532925 -1.679025 -1.719125 1.420625L13.7795 23.0125H10.211525l-2.07745 -1.433625 -1.731975 -1.419025Z" />
        <path fill="#161616" d="m13.303775 18.748225 0.5027 0.3551 0.2946 2.35045 -0.426325 -0.36H10.326425l-0.418225 0.36725 0.284925 -2.357525 0.502875 -0.355275h2.607775Z" />
        <path fill="#763e1a" d="m22.539625 1.19397 1.2104 3.631255 -0.7559 3.67155 0.538275 0.41525 -0.728375 0.555725 0.547375 0.42275 -0.72485 0.660175 0.445025 0.322275 -1.181025 1.379325 -4.844125 -1.4104 -0.041975 -0.0225 -3.490775 -2.9447L22.539625 1.19397Z" />
        <path fill="#763e1a" d="M1.460435 1.19397 10.4864 7.874675l-3.49075 2.9447 -0.042 0.0225 -4.844145 1.4104 -1.181015 -1.379325 0.44467 -0.322025 -0.72453 -0.6604 0.5463775 -0.422325 -0.73926 -0.5573 0.55858 -0.4155L0.25 4.82535 1.460435 1.19397Z" />
        <path fill="#f5841f" d="m16.809475 10.533375 5.132675 1.49435 1.667525 5.1393 -4.39925 0 -3.031225 0.03825 2.204425 -4.296825 -1.57415 -2.375075Z" />
        <path fill="#f5841f" d="m7.19055 10.533375 -1.574425 2.375075 2.204725 4.296825 -3.029725 -0.03825H0.3996575l1.65816 -5.13925 5.1327325 -1.4944Z" />
        <path fill="#f5841f" d="m15.248075 4.026975 -1.43565 3.8774 -0.30465 5.238 -0.116575 1.64175 -0.00925 4.193975H10.617825l-0.008975 -4.1861 -0.11695 -1.651075 -0.3048 -5.23655 -1.4354 -3.8774h6.496375Z" />
      </svg>
      </span>
    );
  if (id === "okx")
    return (
      <span className="wi" style={{ background: "#000", border: "1px solid #2a2a2a" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
          <rect x="2" y="2" width="6.5" height="6.5" />
          <rect x="15.5" y="2" width="6.5" height="6.5" />
          <rect x="8.75" y="8.75" width="6.5" height="6.5" />
          <rect x="2" y="15.5" width="6.5" height="6.5" />
          <rect x="15.5" y="15.5" width="6.5" height="6.5" />
        </svg>
      </span>
    );

    if (id === "trust")
      return (
        <span className="wi" style={{ background: "#fff" }}>

          <svg
            width="25"
            height="25"
            viewBox="0 0 512 512"
            xmlns="http://www.w3.org/2000/svg"
            fillRule="evenodd"
            clipRule="evenodd"
            strokeLinejoin="round"
            strokeMiterlimit={2}
          >
            <path d="M37.523 83.593L255.21 13.046v488.371C99.709 436.301 37.523 311.5 37.523 240.964V83.593z" fill="#0500ff" fillRule="nonzero" />
            <path d="M38.154 6.673L19.433.606v42c13.372-5.6 18.721-16.333 18.721-22.399V6.673z" fill="url(#prefix___Linear1)" fillRule="nonzero" transform="matrix(11.62788 0 0 11.62788 29.256 6)" />
            <defs>
              <linearGradient id="prefix___Linear1" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="rotate(107.581 17.445 10.98) scale(46.5663)">
                <stop offset="0" stopColor="#00f" />
                <stop offset=".02" stopColor="#00f" />
                <stop offset=".08" stopColor="#0094ff" />
                <stop offset=".16" stopColor="#48ff91" />
                <stop offset=".42" stopColor="#0094ff" />
                <stop offset=".68" stopColor="#0038ff" />
                <stop offset=".9" stopColor="#0500ff" />
                <stop offset="1" stopColor="#0500ff" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      );

    if (id === "coinbase")
      return (
        <span className="wi" style={{ background: "#0052FF" }}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8.5" fill="#fff" />
            <rect
              x="8.5"
              y="8.5"
              width="7"
              height="7"
              rx="1.5"
              fill="#0052FF"
            />
          </svg>
        </span>
      );

    if (id === "tokenpocket")
      return (
        <span className="wi" style={{ background: "#fff" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 24 24"
          >
            <g fill="none">
              <path
                fill="url(#tokenBrandedTokenPocket0)"
                d="M15.35 10.793v4.527a4.6 4.6 0 0 0 .936.117h.032v-3.6a1.04 1.04 0 0 1-.968-1.044"
              />
              <path
                fill="#2980FE"
                d="M15.348 10.794H11.78v6.485c0 .307.246.555.55.555h2.467c.304 0 .55-.248.55-.555zm-5.29-4.644H3.55a.55.55 0 0 0-.55.554v2.25c0 .307.246.555.55.555h2.095v7.787c0 .306.246.554.55.554H8.54c.304 0 .55-.248.55-.554V9.509h.959c.92 0 1.667-.754 1.667-1.68a1.66 1.66 0 0 0-1.658-1.679"
              />
              <path
                fill="#2980FE"
                d="M16.39 6.15c-2.545 0-4.61 2.08-4.61 4.644a4.64 4.64 0 0 0 3.57 4.526v-4.526c0-.578.467-1.047 1.04-1.047s1.04.47 1.04 1.047a1.04 1.04 0 0 1-1.04 1.046v3.597q.135 0 .265-.006C19.077 15.29 21 13.269 21 10.794c.003-2.564-2.062-4.644-4.61-4.644"
              />
              <path
                fill="#2980FE"
                d="M16.39 15.437V11.84q-.037 0-.075-.003v3.6z"
              />
              <defs>
                <linearGradient
                  id="tokenBrandedTokenPocket0"
                  x1="16.391"
                  x2="15.351"
                  y1="13.116"
                  y2="13.116"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#2980FE" />
                  <stop offset=".967" stopColor="#6CA8FF" />
                  <stop offset="1" stopColor="#2980FE" />
                </linearGradient>
              </defs>
            </g>
          </svg>
        </span>
      );

    if (id === "safepal")
      return (
        <span
          className="wi"
          style={{ background: "#000", border: "1px solid #2a2a2a" }}
        >
          <svg width="25" height="25" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5359 0C16.3185 -1.12678e-07 15.1509 0.483616 14.2901 1.34446L0.768219 14.8666C0.256067 15.3788 -4.19303e-06 16.05 0 16.7213C4.19313e-06 17.3926 0.256084 18.0638 0.768233 18.576L9.62954 27.4373V11.7495C9.62954 10.5788 10.5712 9.6297 11.7419 9.6297C16.6881 9.6297 28.7279 9.6297 30.3701 9.6297L39.9996 0.000136473L17.5359 0Z" fill="#4A21EF"/>
          <path d="M9.62979 30.3703H28.2505C29.4213 30.3703 30.3703 29.4212 30.3703 28.2505V12.5626L39.2317 21.424C39.7438 21.9362 39.9999 22.6074 39.9999 23.2787C39.9999 23.95 39.7438 24.6212 39.2317 25.1334L25.7098 38.6555C24.849 39.5164 23.6814 40 22.464 40L0.000244141 39.9999L9.62979 30.3703Z" fill="#4A21EF"/>
          </svg>
        </span>
      );

  return (
    <span className="wi" style={{ background: "linear-gradient(288deg, rgb(0 0 0), rgb(0 20 141))" }}>
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path fill="url(#rabby__a)" d="M20.908 13.17c.707-1.644-2.788-6.235-6.127-8.148-2.105-1.482-4.298-1.279-4.742-.628-.975 1.428 3.228 2.638 6.038 4.05a3.25 3.25 0 0 0-1.508 1.39c-1.048-1.19-3.347-2.216-6.046-1.39-1.819.556-3.33 1.868-3.914 3.85a1.1 1.1 0 0 0-.464-.103c-.632 0-1.145.533-1.145 1.191s.513 1.191 1.145 1.191c.117 0 .483-.081.483-.081l5.855.044c-2.341 3.865-4.192 4.43-4.192 5.1s1.77.488 2.436.238c3.182-1.195 6.6-4.919 7.187-5.99 2.463.32 4.533.357 4.994-.715" />
      <path fill="url(#rabby__b)" fillRule="evenodd" clipRule="evenodd" d="M16.077 8.444c.13-.053.11-.253.074-.41-.082-.362-1.5-1.82-2.833-2.473-1.815-.89-3.152-.843-3.35-.433.37.788 2.085 1.529 3.875 2.302.764.33 1.541.666 2.234 1.014" />
      <path fill="url(#rabby__c)" fillRule="evenodd" clipRule="evenodd" d="M13.774 16.38c-.367-.145-.782-.28-1.254-.4.503-.937.609-2.322.134-3.199-.666-1.229-1.503-1.883-3.446-1.883-1.07 0-3.947.374-3.998 2.874q-.009.393.018.724l5.255.04a18.7 18.7 0 0 1-1.953 2.696c.698.186 1.273.342 1.802.486.501.136.96.26 1.44.388a22 22 0 0 0 2.002-1.726" />
      <path fill="url(#rabby__d)" d="M4.539 14.24c.215 1.898 1.252 2.642 3.371 2.863 2.12.22 3.335.072 4.954.225 1.352.128 2.559.845 3.006.598.403-.223.178-1.029-.361-1.546-.7-.67-1.667-1.135-3.369-1.3.34-.967.244-2.322-.282-3.06-.762-1.065-2.168-1.547-3.948-1.337-1.859.22-3.64 1.173-3.371 3.556" />
      <defs>
        <linearGradient id="rabby__a" x1="8.311" x2="20.827" y1="11.714" y2="15.125" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8697FF" />
          <stop offset="1" stopColor="#ABB7FF" />
        </linearGradient>
        <linearGradient id="rabby__b" x1="18.66" x2="9.323" y1="11.468" y2="2.473" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8697FF" />
          <stop offset="1" stopColor="#5156D8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rabby__c" x1="14.023" x2="5.231" y1="16.707" y2="11.849" gradientUnits="userSpaceOnUse">
          <stop stopColor="#465EED" />
          <stop offset="1" stopColor="#8697FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rabby__d" x1="9.054" x2="15.173" y1="11.617" y2="19.089" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8898FF" />
          <stop offset=".984" stopColor="#6277F1" />
        </linearGradient>
      </defs>
    </svg>

    </span>
  );
}

export default function WalletModal() {
  const { modalOpen, closeModal, connect, connecting, error, isInstalled } = useWallet();

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

  if (!modalOpen) return null;

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Connect wallet">
        <div className="modal-head">
          <h3>Connect Wallet</h3>
          <button className="modal-x" onClick={closeModal} aria-label="Close">×</button>
        </div>
        <p className="sub">Choose a wallet to access your Aritoham dashboard.</p>

        {WALLETS.map((w) => {
          const ok = isInstalled(w.id);
          return (
            <button key={w.id} className="wallet-opt" disabled={!!connecting} onClick={() => connect(w.id)}>
              <WalletIcon id={w.id} />
              <span>{w.name}</span>
              <span className={`st ${ok ? "ok" : ""}`}>
                {connecting === w.id ? "Connecting…" : ok ? "Detected" : "Install"}
              </span>
            </button>
          );
        })}

        {error && <div className="err">{error}</div>}
        <div className="foot">By connecting you agree to the Terms of Use. Never share your seed phrase.</div>
      </div>
    </div>
  );
}
