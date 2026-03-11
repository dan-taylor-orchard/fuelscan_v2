'use client';

import { useState } from 'react';
import { FuelSearchResult, FUEL_TYPES } from './types';

const KM_OPTIONS = [
  { label: '10,000 km', value: 10000 },
  { label: '15,000 km', value: 15000 },
  { label: '20,000 km', value: 20000 },
  { label: '25,000 km', value: 25000 },
  { label: '30,000+ km', value: 30000 },
];

const PETROL_L_PER_100KM = 6.6;
const EV_KWH_PER_100KM = 14.8;
const ELECTRICITY_RATE_CENTS = 30;

function calcSavings(pricePerLitreCents: number, kmPerYear: number) {
  const petrolAnnualLitres = (kmPerYear / 100) * PETROL_L_PER_100KM;
  const petrolAnnualCost = (petrolAnnualLitres * pricePerLitreCents) / 100;
  const evAnnualKwh = (kmPerYear / 100) * EV_KWH_PER_100KM;
  const evAnnualCost = (evAnnualKwh * ELECTRICITY_RATE_CENTS) / 100;
  const annualSaving = petrolAnnualCost - evAnnualCost;
  return { petrolAnnualCost, evAnnualCost, annualSaving };
}

function fmtDollars(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
}

export default function Home() {
  const [postcode,  setPostcode]  = useState('');
  const [fuelType,  setFuelType]  = useState('E10');
  const [kmPerYear, setKmPerYear] = useState(15000);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [result,    setResult]    = useState<FuelSearchResult | null>(null);
  const [step,      setStep]      = useState<'form' | 'results'>('form');

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!/^\d{4}$/.test(postcode)) {
      setError('Please enter a valid 4-digit NSW postcode.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcode, fuelType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not fetch fuel prices. Please try again.');
        return;
      }
      setResult(data as FuelSearchResult);
      setStep('results');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep('form');
    setResult(null);
    setError('');
  }

  const savings = result ? calcSavings(result.cheapest, kmPerYear) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #e8e8e8; min-height: 100vh; }

        .hero {
          min-height: 100vh;
          background:
            linear-gradient(to right, rgba(240,240,240,0.0) 40%, rgba(240,240,240,0.5) 100%),
            url('/kona-hero.png') center top / cover no-repeat;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 2rem clamp(1.5rem, 6vw, 7rem);
        }

        .modal {
          background: #fff;
          border-radius: 2px;
          width: 100%;
          max-width: 390px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.22), 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .modal-header {
          background: #002c5f;
          padding: 1.2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .modal-header-icon {
          width: 34px; height: 34px;
          background: #00aad2;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .modal-header h2 { color: #fff; font-size: 0.92rem; font-weight: 700; line-height: 1.3; }
        .modal-header p  { color: rgba(255,255,255,0.6); font-size: 0.7rem; margin-top: 0.12rem; }

        .modal-body { padding: 1.35rem 1.5rem 1.5rem; }

        .field-label {
          display: block;
          font-size: 0.65rem; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #777; margin-bottom: 0.38rem;
        }

        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; margin-bottom: 0.95rem; }

        .input-field {
          width: 100%; padding: 0.58rem 0.8rem;
          border: 1.5px solid #e0e0e0; border-radius: 2px;
          font-size: 0.875rem; font-family: 'Inter', sans-serif;
          color: #111; background: #fafafa; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          appearance: none; -webkit-appearance: none;
        }
        .input-field:focus { border-color: #002c5f; box-shadow: 0 0 0 3px rgba(0,44,95,0.09); background: #fff; }

        select.input-field {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath fill='%23666' d='M5 7L0 0h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 0.7rem center;
          background-color: #fafafa; padding-right: 1.8rem; cursor: pointer;
        }

        .km-label { display: block; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #777; margin-bottom: 0.45rem; }
        .km-options { display: flex; gap: 0.35rem; margin-bottom: 1rem; }
        .km-option { flex: 1; cursor: pointer; }
        .km-option input[type="radio"] { display: none; }
        .km-option-label {
          display: block; text-align: center;
          padding: 0.42rem 0.2rem;
          border: 1.5px solid #e0e0e0; border-radius: 2px;
          font-size: 0.68rem; font-weight: 600; color: #666;
          cursor: pointer; transition: all 0.15s;
          white-space: nowrap; background: #fafafa;
          line-height: 1.3;
        }
        .km-option input[type="radio"]:checked + .km-option-label { background: #002c5f; border-color: #002c5f; color: #fff; }
        .km-option-label:hover { border-color: #002c5f; color: #002c5f; }

        .cta-btn {
          width: 100%; padding: 0.8rem 1rem;
          background: #002c5f; color: #fff; border: none; border-radius: 2px;
          font-size: 0.9rem; font-weight: 700; letter-spacing: 0.03em;
          cursor: pointer; transition: background 0.15s, transform 0.1s;
          font-family: 'Inter', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 0.45rem;
        }
        .cta-btn:hover:not(:disabled) { background: #003a7a; }
        .cta-btn:active:not(:disabled) { transform: scale(0.99); }
        .cta-btn:disabled { background: #99aabf; cursor: not-allowed; }
        .cta-btn-ev { background: linear-gradient(135deg, #002c5f 0%, #00aad2 100%); margin-top: 0.5rem; }
        .cta-btn-ev:hover:not(:disabled) { background: linear-gradient(135deg, #003a7a 0%, #009fc4 100%); }

        .error-msg { background: #fff5f5; border: 1px solid #fcc; border-radius: 2px; color: #c0392b; font-size: 0.78rem; padding: 0.55rem 0.8rem; margin-bottom: 0.8rem; line-height: 1.5; }

        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .results-enter { animation: slideUp 0.28s ease both; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        .back-btn { background: none; border: none; color: #002c5f; font-size: 0.72rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; padding: 0; display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.9rem; text-decoration: underline; text-underline-offset: 2px; }

        .fuel-info-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.7rem; color: #888; margin-bottom: 0.8rem; padding-bottom: 0.7rem; border-bottom: 1px solid #eee; }

        .price-badge { background: #f6f7f9; border-radius: 2px; padding: 0.65rem 0.8rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .price-badge-left { display: flex; align-items: center; gap: 0.5rem; }
        .price-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .price-badge-name { font-size: 0.76rem; font-weight: 600; color: #222; }
        .price-badge-sub  { font-size: 0.65rem; color: #999; margin-top: 0.08rem; }
        .price-badge-value { font-size: 1rem; font-weight: 700; color: #111; white-space: nowrap; }

        .savings-banner { background: linear-gradient(135deg, #002c5f 0%, #00aad2 100%); border-radius: 2px; padding: 0.95rem 1rem; margin: 0.8rem 0 0.85rem; display: flex; align-items: center; gap: 0.85rem; }
        .savings-banner-icon { font-size: 1.5rem; flex-shrink: 0; }
        .savings-banner-label { color: rgba(255,255,255,0.75); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.25rem; }
        .savings-banner-amount { color: #fff; font-size: 1.6rem; font-weight: 800; line-height: 1; letter-spacing: -0.02em; }
        .savings-banner-sub { color: rgba(255,255,255,0.6); font-size: 0.65rem; margin-top: 0.18rem; }

        .live-dot { display: inline-block; width: 6px; height: 6px; background: #27ae60; border-radius: 50%; margin-right: 4px; vertical-align: middle; animation: pulse 2s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .disclaimer { color: #bbb; font-size: 0.6rem; line-height: 1.55; margin-top: 0.85rem; padding-top: 0.7rem; border-top: 1px solid #eee; }

        @media (max-width: 600px) {
          .hero { justify-content: center; align-items: flex-end; padding: 1rem 1rem 2.5rem; background-position: center center; }
          .modal { max-width: 100%; }
        }
      `}</style>

      <div className="hero">
        <div className="modal">

          {/* ── Header ── */}
          <div className="modal-header">
            <div className="modal-header-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <h2>KONA Electric Fuel Savings</h2>
              <p>Compare your petrol cost vs home EV charging</p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="modal-body">

            {/* FORM */}
            {step === 'form' && (
              <form onSubmit={handleCalculate}>

                <div className="input-row">
                  <div>
                    <label className="field-label" htmlFor="postcode">NSW Postcode</label>
                    <input
                      id="postcode" className="input-field"
                      type="text" inputMode="numeric" maxLength={4}
                      placeholder="e.g. 2000" value={postcode}
                      onChange={e => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="fueltype">Fuel Type</label>
                    <select id="fueltype" className="input-field" value={fuelType} onChange={e => setFuelType(e.target.value)}>
                      {Object.entries(FUEL_TYPES).map(([val, label]) => (
                        <option key={val} value={val}>{label.split('—')[0].trim()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="km-label">Estimated km / year</span>
                  <div className="km-options">
                    {KM_OPTIONS.map(opt => (
                      <label key={opt.value} className="km-option">
                        <input type="radio" name="kmPerYear" value={opt.value}
                          checked={kmPerYear === opt.value}
                          onChange={() => setKmPerYear(opt.value)} />
                        <span className="km-option-label">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <button type="submit" className="cta-btn" disabled={loading}>
                  {loading ? (
                    <><span className="spinner" /> Fetching live prices…</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                        <polyline points="16 7 22 7 22 13"/>
                      </svg>
                      Calculate Fuel Savings
                    </>
                  )}
                </button>
              </form>
            )}

            {/* RESULTS */}
            {step === 'results' && result && savings && (
              <div className="results-enter">
                <button className="back-btn" onClick={handleReset}>← Recalculate</button>

                <div className="fuel-info-row">
                  <span>
                    <span className="live-dot" />
                    Live {FUEL_TYPES[result.fuelType]?.split('—')[0].trim()} near {result.postcode}
                  </span>
                  <strong style={{ color: '#111' }}>{result.cheapest.toFixed(1)}¢/L cheapest</strong>
                </div>

                <div className="price-badge">
                  <div className="price-badge-left">
                    <div className="price-dot" style={{ background: '#e74c3c' }} />
                    <div>
                      <div className="price-badge-name">KONA Petrol 2.0L</div>
                      <div className="price-badge-sub">6.6L/100km · {(kmPerYear/1000).toFixed(0)}k km/yr</div>
                    </div>
                  </div>
                  <div className="price-badge-value">
                    {fmtDollars(savings.petrolAnnualCost)}
                    <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#999' }}>/yr</span>
                  </div>
                </div>

                <div className="price-badge">
                  <div className="price-badge-left">
                    <div className="price-dot" style={{ background: '#00aad2' }} />
                    <div>
                      <div className="price-badge-name">KONA Electric</div>
                      <div className="price-badge-sub">14.8 kWh/100km · 30¢/kWh home</div>
                    </div>
                  </div>
                  <div className="price-badge-value">
                    {fmtDollars(savings.evAnnualCost)}
                    <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#999' }}>/yr</span>
                  </div>
                </div>

                <div className="savings-banner">
                  <div className="savings-banner-icon">⚡</div>
                  <div>
                    <div className="savings-banner-label">You could save</div>
                    <div className="savings-banner-amount">{fmtDollars(savings.annualSaving)}</div>
                    <div className="savings-banner-sub">per year switching to KONA Electric</div>
                  </div>
                </div>

                <a href="https://www.hyundai.com/au/en/cars/eco/kona-electric" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                  <button className="cta-btn cta-btn-ev" type="button">
                    Explore KONA Electric →
                  </button>
                </a>

                <div className="disclaimer">
                  * Based on cheapest local {FUEL_TYPES[result.fuelType]?.split('—')[0].trim()} price of {result.cheapest.toFixed(1)}¢/L near {result.postcode}. Home electricity at 30¢/kWh. Kona 2.0L: 6.6L/100km ADR official. Kona Electric: 14.8 kWh/100km WLTP. Estimates only — actual costs vary by driving style and electricity tariff.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
