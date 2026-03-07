import React from 'react';

const aminoacidos = [
  'Leucina (desarrollo y recuperación muscular)',
  'Isoleucina (energía y reparación)',
  'Valina (crecimiento tisular)',
  'Lisina (colágeno y absorción de calcio)',
  'Metionina (desintoxicación y metabolismo)',
  'Fenilalanina (neurotransmisores y estado de ánimo)',
  'Treonina (sistema inmune y colágeno)',
  'Triptófano (serotonina y sueño)',
  'Histidina (crecimiento y reparación)'
];

const vitaminasB = [
  { nombre: 'B1 (Tiamina)', dosis: '5g: 0.2–0.35 mg | 10g: 0.4–0.7 mg', aporte: '15–60% VRN aprox.', bio: 'Buena' },
  { nombre: 'B2 (Riboflavina)', dosis: '5g: 0.15–0.25 mg | 10g: 0.3–0.5 mg', aporte: '12–40% VRN aprox.', bio: 'Excelente' },
  { nombre: 'B3 (Niacina)', dosis: '5g: 0.6–0.8 mg | 10g: 1.2–1.6 mg', aporte: '4–11% VRN aprox.', bio: 'Buena' },
  { nombre: 'B6', dosis: '5g: 0.04–0.08 mg', aporte: '3–6% VRN aprox.', bio: 'Buena' },
  { nombre: 'B9 (folato)', dosis: '5g: 5–10 mcg', aporte: '1–2.5% VRN aprox.', bio: 'Buena' }
];

const minerales = [
  { nombre: 'Manganeso', aporte: '40–60% con 5g', nota: 'Excelente fuente en dosis prácticas.' },
  { nombre: 'Hierro', aporte: '10–18% con 5g', nota: 'Buen apoyo, útil para dietas vegetales.' },
  { nombre: 'Magnesio', aporte: '5–6% con 5g', nota: 'Complemento menor.' },
  { nombre: 'Potasio', aporte: '2–3% con 5g', nota: 'Aporte bajo.' },
  { nombre: 'Selenio', aporte: '0.5–7% con 5g', nota: 'Variable y no confiable como fuente principal.' }
];

function App() {
  return (
    <div className="landing">
      <header className="hero" id="inicio">
        <nav className="topbar">
          <a href="#inicio" className="brand" aria-label="Neka">
            <img src="/image.png" alt="Logo Neka" className="brand-logo" />
            <span>Neka</span>
          </a>
          <a href="#contacto" className="cta cta-outline">Comprar espirulina fresca</a>
        </nav>

        <div className="hero-content">
          <div>
            <p className="eyebrow">Superalimento vivo · Espirulina fresca</p>
            <h1>Energía, nutrición y bienestar diario con Neka</h1>
            <p className="lead">
              La espirulina es una cianobacteria microscópica de forma espiral, cultivada en ambientes controlados.
              En Neka la presentamos fresca para personas activas, deportistas y familias que buscan una nutrición
              más consciente.
            </p>
            <div className="hero-cta-row">
              <a href="#perfil" className="cta">Ver perfil nutricional</a>
              <a href="#contacto" className="cta cta-ghost">Quiero asesoría</a>
            </div>
          </div>

          <article className="hero-card">
            <img src="/fresh_spirulina_comparison_1770249323663.png" alt="Espirulina fresca Neka" />
            <p>
              Proteína de élite (60–70%), antioxidantes potentes y aporte funcional para rendimiento, salud metabólica
              y soporte inmune.
            </p>
          </article>
        </div>
      </header>

      <main>
        <section id="perfil" className="section">
          <h2>Perfil nutricional excepcional</h2>
          <p className="section-text">
            La espirulina aporta proteína completa, hierro biodisponible, vitaminas del complejo B, antioxidantes
            (ficocianina, betacarotenos, vitamina E), minerales y clorofila. Es vegetal, sostenible y de alta
            digestibilidad (83–90%).
          </p>
          <div className="pill-grid">
            <span>60–70% proteína</span>
            <span>9 aminoácidos esenciales</span>
            <span>Ficocianina de alta potencia</span>
            <span>Hierro biodisponible</span>
            <span>GLA (omega-6 antiinflamatorio)</span>
            <span>Clorofila desintoxicante</span>
          </div>
        </section>

        <section className="section split" id="proteina">
          <div>
            <h2>Proteína de élite</h2>
            <p className="section-text">
              Una de las fuentes proteicas más concentradas del planeta. En 10g aporta aproximadamente 6–7g de proteína
              pura, con todos los aminoácidos esenciales y absorción elevada.
            </p>
            <ul>
              {aminoacidos.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <img className="feature-image" src="/spirulina_protein_muscles_1770248607278.png" alt="Proteína de espirulina para deporte" />
        </section>

        <section className="section" id="vitaminas-b">
          <h2>Vitaminas del complejo B en dosis reales</h2>
          <p className="section-text">
            Aporte destacado en B1 y B2; apoyo moderado en B3, B6 y B9. Nota importante: la B12 de espirulina no debe
            considerarse fuente única para cubrir requerimientos humanos.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vitamina</th>
                  <th>Dosis estimada</th>
                  <th>Aporte</th>
                  <th>Biodisponibilidad</th>
                </tr>
              </thead>
              <tbody>
                {vitaminasB.map((vit) => (
                  <tr key={vit.nombre}>
                    <td>{vit.nombre}</td>
                    <td>{vit.dosis}</td>
                    <td>{vit.aporte}</td>
                    <td>{vit.bio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section split" id="antioxidantes">
          <div>
            <h2>Antioxidantes potentes y sinergia 360°</h2>
            <p className="section-text">
              La ficocianina (15–20% del peso seco) es su compuesto estrella. Junto con betacarotenos, vitamina E,
              zeaxantina y clorofila, ofrece protección antioxidante en sangre, membranas y tejidos.
            </p>
            <ul>
              <li><strong>Ficocianina:</strong> apoyo antiinflamatorio e inmunomodulador.</li>
              <li><strong>Betacarotenos:</strong> precursores de vitamina A, soporte ocular y de piel.</li>
              <li><strong>Vitamina E:</strong> protección de membranas celulares.</li>
              <li><strong>ORAC alto:</strong> ~24,000–60,000 por 100g (según cepa).</li>
            </ul>
          </div>
          <img className="feature-image" src="/spirulina_antioxidant_cells_1770248644460.png" alt="Antioxidantes de la espirulina" />
        </section>

        <section className="section" id="minerales">
          <h2>Minerales: información honesta en dosis prácticas</h2>
          <div className="mineral-grid">
            {minerales.map((mineral) => (
              <article key={mineral.nombre} className="mineral-card">
                <h3>{mineral.nombre}</h3>
                <p><strong>Aporte:</strong> {mineral.aporte}</p>
                <p>{mineral.nota}</p>
              </article>
            ))}
          </div>
          <p className="section-text">
            Mensaje clave: la espirulina destaca especialmente en manganeso e hierro. En magnesio suma, pero en potasio,
            calcio y selenio no debe verse como fuente principal.
          </p>
        </section>

        <section className="section split" id="beneficios">
          <img className="feature-image" src="/spirulina_heart_circulation_1770248705736.png" alt="Beneficios cardiovasculares y metabólicos" />
          <div>
            <h2>Beneficios potenciales respaldados por evidencia</h2>
            <ul>
              <li>Fortalecimiento del sistema inmunológico.</li>
              <li>Acción antioxidante y antiinflamatoria.</li>
              <li>Apoyo cardiovascular (presión arterial y lípidos).</li>
              <li>Soporte en control de glucosa y energía física.</li>
              <li>Complemento nutricional en programas de salud pública.</li>
            </ul>
            <p className="section-text">
              Estudios humanos reportan mejoras con dosis de 2g a 7.5g/día en marcadores de estrés oxidativo,
              presión arterial y control glucémico, según contexto clínico.
            </p>
          </div>
        </section>

        <section className="section" id="uso">
          <h2>Cómo maximizar sus beneficios</h2>
          <div className="tips-grid">
            <article>
              <h3>Consumo sugerido</h3>
              <p>5–10g diarios, idealmente por la mañana.</p>
            </article>
            <article>
              <h3>Mejor absorción</h3>
              <p>Combínala con grasa saludable (aguacate, frutos secos, AOVE) para carotenoides y vitamina E.</p>
            </article>
            <article>
              <h3>Evita</h3>
              <p>Cocción o temperaturas altas (&gt;60°C), ya que degradan antioxidantes sensibles.</p>
            </article>
            <article>
              <h3>Sinergias</h3>
              <p>Puede combinarse con vitamina C, cúrcuma y omega-3 dentro de una alimentación variada.</p>
            </article>
          </div>
        </section>

        <section className="section note">
          <h2>Transparencia y seguridad</h2>
          <p>
            Neka comunica información nutricional con enfoque responsable: la espirulina es un excelente complemento,
            pero no reemplaza una dieta equilibrada ni tratamientos médicos. Si estás embarazada, lactando, tomas
            anticoagulantes o tienes una condición clínica, consulta a tu profesional de salud.
          </p>
        </section>
      </main>

      <footer id="contacto" className="footer">
        <h2>Lleva la espirulina fresca Neka a tu rutina</h2>
        <p>Te ayudamos a elegir la dosis y forma de uso según tus objetivos de bienestar y rendimiento.</p>
        <a className="cta" href="https://wa.me/573000000000" target="_blank" rel="noreferrer">
          Hablar por WhatsApp
        </a>
      </footer>
    </div>
  );
}

export default App;
