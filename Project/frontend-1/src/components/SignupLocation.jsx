import { useEffect, useState } from "react";
import Field from "./SxField.jsx";
import CountryPicker from "./CountryPicker.jsx";
import { country as loadCountry, zipHint, zipOk } from "../teen/geo.js";

// Country → State / Province → City → ZIP / Postal code for the Consumer and Professional sign-up.
// Same data and order as the Teen sign-up (public/data/geo). The values go to address[0] on PUT /api/v1/user,
// which already stores country, state, city and zipcode.
export function useGeo(iso) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let live = true;
    setData(null);
    if (!iso) return undefined;
    setLoading(true);
    loadCountry(iso).then((d) => { if (live) setData(d); }).catch(() => { if (live) setData({ s: [], z: "" }); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [iso]);
  return { data, loading };
}

// Errors for the location fields, in the sign-up's message style.
export function locationErrors(v, geo) {
  const e = {};
  if (!v.country) return e; // the country message comes from validateSignup
  const states = geo?.s || [];
  if (states.length && !v.state.trim()) e.state = "Choose your state, province or region.";
  if (!v.city.trim()) e.city = "Enter your town or city.";
  const z = geo?.z || "";
  if (!v.noZip) {
    if (z && !v.zip.trim()) e.zip = "Enter your ZIP or postal code.";
    else if (z && !zipOk(z, v.zip)) e.zip = `That postal code doesn’t look right${zipHint(z) ? ` (${zipHint(z)})` : ""}.`;
  }
  return e;
}

export default function SignupLocation({ v, setV, list, err, ok, touch, geo, loading }) {
  const sOpts = geo?.s || [];
  const hasStates = sOpts.length > 0;
  const cities = sOpts.find((s) => s.c === v.stateCode)?.ci || [];
  const zipFormat = geo?.z || "";
  const setLoc = (patch) => setV((s) => ({ ...s, ...patch }));
  return (
    <>
      <div className={`sx-field ${err("country") ? "bad" : ""} ${ok("country") ? "good" : ""}`} style={{ gridColumn: "1 / -1" }}>
        <span className="sx-static-label" id="country-lbl">Country of residence</span>
        <CountryPicker id="country" list={list} value={v.country} invalid={Boolean(err("country"))} describedBy={err("country") ? "country-err" : "country-lbl"}
          onChange={(c) => { setV((s) => ({ ...s, country: c.iso, phoneIso: s.phoneIso || c.iso, stateCode: "", state: "", stateManual: false, city: "", zip: "", noZip: false })); touch("country"); }} />
        {err("country") ? <p className="f-err" id="country-err" role="alert">{err("country")}</p> : null}
      </div>
      {v.country ? (
        <>
          <Field id="state" label={hasStates ? "State / province / region" : "State / region (optional)"} icon="pin" half error={err("state")} ok={ok("state") && Boolean(v.state)}
            hint={loading ? "Loading…" : hasStates ? "" : "This country has no states on our list. Type yours if you like."}>
            {hasStates && !v.stateManual ? (
              <select id="state" className={v.stateCode ? "has-val" : ""} value={v.stateCode} aria-invalid={Boolean(err("state"))}
                onChange={(e) => { if (e.target.value === "__type") setLoc({ stateCode: "", state: "", stateManual: true, city: "" }); else setLoc({ stateCode: e.target.value, state: sOpts.find((s) => s.c === e.target.value)?.n || "", stateManual: false, city: "" }); touch("state"); }}>
                <option value="" disabled hidden />
                {sOpts.map((s) => <option key={s.c} value={s.c}>{s.n}</option>)}
                <option value="__type">Not listed: I’ll type it</option>
              </select>
            ) : (
              <input id="state" placeholder=" " maxLength={80} value={v.state} aria-invalid={Boolean(err("state"))} autoComplete="address-level1"
                onChange={(e) => setLoc({ state: e.target.value, stateCode: "", stateManual: true })} onBlur={() => touch("state")} />
            )}
          </Field>
          <Field id="city" label="Town / city" icon="home" half error={err("city")} ok={ok("city")} hint={cities.length ? "Pick from the list or type it." : ""}>
            <input id="city" placeholder=" " maxLength={80} list={cities.length ? "city-list" : undefined} value={v.city} aria-invalid={Boolean(err("city"))}
              onChange={(e) => setLoc({ city: e.target.value })} onBlur={() => touch("city")} autoComplete="address-level2" />
            {cities.length ? <datalist id="city-list">{cities.map((c) => <option key={c} value={c} />)}</datalist> : null}
          </Field>
          <Field id="zip" label={zipFormat ? "ZIP / postal code" : "ZIP / postal code (optional)"} icon="mail" half error={v.noZip ? "" : err("zip")} ok={ok("zip") && Boolean(v.zip)}
            hint={zipHint(zipFormat) ? `For example ${zipHint(zipFormat)}` : ""}>
            <input id="zip" placeholder=" " maxLength={12} value={v.zip} disabled={v.noZip} aria-invalid={Boolean(!v.noZip && err("zip"))}
              onChange={(e) => setLoc({ zip: e.target.value.toUpperCase(), noZip: false })} onBlur={() => touch("zip")} autoComplete="postal-code" />
          </Field>
          <label className="sx-consent half sx-nozip">
            <input type="checkbox" checked={Boolean(v.noZip)} onChange={(e) => setLoc({ noZip: e.target.checked, zip: e.target.checked ? "" : v.zip })} />
            <span>I don’t have a postal code</span>
          </label>
        </>
      ) : null}
    </>
  );
}
