"use client";

export default function ProductCard({ part, modelNumber, onAction }) {
  const fitBadge =
    modelNumber && part.compatibility?.compatible
      ? `Fits your model ${modelNumber}`
      : modelNumber && part.compatibility?.fitConfidence === "low"
      ? `Fit not confirmed for ${modelNumber}`
      : null;

  return (
    <article className="product-card">
      <div className="product-card-top">
        <h4>{part.name}</h4>
        <span className="price">${part.price.toFixed(2)}</span>
      </div>
      <p className="muted">
        {part.psNumber} | Mfr #{part.partNumber} | {part.manufacturer}
      </p>
      <p className="muted">
        {part.inStock ? "In stock" : "Backordered"} - {part.shippingEta}
      </p>
      {fitBadge ? <p className="fit-badge">{fitBadge}</p> : null}
      <div className="card-actions">
        <button onClick={() => onAction("check-fit", part.psNumber)}>Check fit</button>
        <button onClick={() => onAction("install", part.psNumber)}>Install guide</button>
        <button onClick={() => onAction("cart", part.psNumber)}>Add to cart</button>
      </div>
    </article>
  );
}
