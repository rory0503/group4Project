import { Droplet, Zap, Cloud, Globe, Leaf } from "lucide-react";


export default function LoginSummaryCard() {
    const css = `

.auth-card {
  box-sizing: border-box;
  min-height: 600px;
  border: 2px solid #7ca982;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}

.auth-info { background: #f0f6ee; padding: 45px 33px 33px; }
.auth-art { position: relative; width: 135px; height: 100px; }

.auth-art-globe {
  width: 92px; height: 92px; border-radius: 50%;
  background: #0f4c5c; color: #a8d5b5;
  display: flex; align-items: center; justify-content: center;
}

.auth-art-leaf { position: absolute; top: -6px; left: 62px; color: #0f3d2e; fill: #4ea75a; }

.auth-info h2 { margin: 56px 0 0; max-width: 299px; font-size: 26px; font-weight: 600; line-height: 1.2; }

.auth-info p { margin: 16px 0 0; max-width: 299px; font-size: 15px; line-height: 1.4; }

.auth-tiles { margin-top: auto; padding-top: 36px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 17px; }

.auth-tile { min-height: 150px; padding: 14px 10px; border: 1px solid #7ca982; border-radius: 10px; background: #f0f6ee; }

.auth-tile-icon { position: relative; height: 44px; display: flex; align-items: center; }

.auth-tile-icon small { position: absolute; left: 17px; top: 14px; font-size: 9px; font-weight: 700; }

.auth-tile h3 { margin: 8px 0 0; font-size: 14px; font-weight: 600; }

.auth-tile span { display: block; margin-top: 6px; font-size: 11px; line-height: 1.35; }
`;


    return (
        <>
            <style>{css}</style>
            <div className="auth-art" aria-hidden="true">
                <div className="auth-art-globe"><Globe size={64} strokeWidth={1.5} /></div>
                <Leaf className="auth-art-leaf" size={52} strokeWidth={1.5} />
            </div>

            <h2>Make more sustainable AI choices</h2>
            <p>Compare the water, energy and Co2 impacts of AI models to make informed, more sustainable decisions.</p>


            <div className="auth-tiles">
                <div className="auth-tile">
                    <div className="auth-tile-icon" aria-hidden="true"><Droplet size={32} strokeWidth={1.5} /></div>
                    <h3>Water</h3>
                    <span>See how much water is used by AI models.</span>
                </div>
                <div className="auth-tile">
                    <div className="auth-tile-icon" aria-hidden="true"><Zap size={30} strokeWidth={1.5} /></div>
                    <h3>Energy</h3>
                    <span>Track electricity consumption and power usage.</span>
                </div>
                <div className="auth-tile">
                    <div className="auth-tile-icon" aria-hidden="true">
                        <Cloud size={46} strokeWidth={1.5} />
                        <small>co2</small>
                    </div>
                    <h3>CO2</h3>
                    <span>Understand carbon emissions and climate impact.</span>
                </div>
            </div>
        </>
    );


};