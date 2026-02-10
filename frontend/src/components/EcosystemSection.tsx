export default function EcosystemSection() {
  const ecosystems = [
    {
      icon: "store",
      color: "green-400",
      hoverColor: "green-900/40",
      borderColor: "green-500/50",
      shadowColor: "rgba(74,222,128,0.1)",
      title: "Donors",
      description:
        "Restaurants, supermarkets, and farms upload surplus inventory instantly.",
      delay: "delay-100",
    },
    {
      icon: "local_shipping",
      color: "blue-400",
      hoverColor: "blue-900/40",
      borderColor: "blue-500/50",
      shadowColor: "rgba(59,130,246,0.1)",
      title: "Transport",
      description:
        "Volunteer drivers and partner fleets execute optimized pickup runs.",
      delay: "delay-200",
    },
    {
      icon: "volunteer_activism",
      color: "primary",
      hoverColor: "primary/20",
      borderColor: "primary/50",
      shadowColor: "rgba(251,146,60,0.1)",
      title: "Recipients",
      description:
        "Shelters, food banks, and community centers receive fresh deliveries.",
      delay: "delay-300",
    },
    {
      icon: "public",
      color: "purple-400",
      hoverColor: "purple-900/40",
      borderColor: "purple-500/50",
      shadowColor: "rgba(168,85,247,0.1)",
      title: "Planet",
      description:
        "Less methane in landfills, reduced carbon footprint, a healthier earth.",
      delay: "delay-400",
    },
  ];

  return (
    <section className="relative py-32 px-4 md:px-10 max-w-7xl mx-auto z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 reveal">
          The Ecosystem
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg reveal delay-100">
          A seamless loop connecting those who have with those who need, powered
          by community.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ecosystems.map((item, index) => (
          <div
            key={index}
            className={`glass-card p-8 group hover:-translate-y-2 transition-transform duration-300 hover:shadow-[0_10px_30px_${item.shadowColor}] reveal ${item.delay}`}
          >
            <div className="glass-highlight"></div>
            <div
              className={`w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:bg-${item.hoverColor} transition-colors border border-slate-700 group-hover:border-${item.borderColor} shadow-inner`}
            >
              <span
                className={`material-symbols-outlined text-${item.color} text-3xl`}
              >
                {item.icon}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-slate-400 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
