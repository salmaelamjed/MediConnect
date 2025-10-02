interface NotificationTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  counts: {
    all: number;
    appointment_confirmation: number;
  };
}

export const NotificationTabs = ({
  activeTab,
  onTabChange,
  counts,
}: NotificationTabsProps) => {
  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "appointment_confirmation", label: "Appointments", count: counts.appointment_confirmation },
  ];

  return (
    <div className="flex gap-6 py-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className="ml-1.5 text-xs">({tab.count})</span>
          )}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};
