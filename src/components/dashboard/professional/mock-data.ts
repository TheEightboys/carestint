
export const availableStints = [
    {
        id: "STINT-101",
        role: "Registered Nurse (RN)",
        facility: "Rusinga Nursing Home",
        location: "Nairobi",
        shift: "Full-day",
        date: "2024-08-15",
        rate: 8000,
        rateType: "Fixed Rate",
        allowBids: false,
    },
    {
        id: "STINT-102",
        role: "Clinical Officer",
        facility: "Nairobi West Hospital",
        location: "Nairobi",
        shift: "Half-day",
        date: "2024-08-16",
        rate: 4500,
        rateType: "Bidding Allowed",
        allowBids: true,
    },
    {
        id: "STINT-103",
        role: "Lab Technician",
        facility: "Mulago Hospital",
        location: "Kampala",
        shift: "Full-day",
        date: "2024-08-18",
        rate: 6500,
        rateType: "Fixed Rate",
        allowBids: false,
    },
];


export const myApplications = [
    {
        id: "APP-001",
        stintId: "STINT-098",
        role: "Dentist",
        facility: "City Dental Clinic",
        appliedDate: "2024-08-10",
        status: "Accepted",
    },
    {
        id: "APP-002",
        stintId: "STINT-099",
        role: "Registered Nurse (RN)",
        facility: "Community Health Center",
        appliedDate: "2024-08-11",
        status: "Pending",
    },
    {
        id: "APP-003",
        stintId: "STINT-100",
        role: "Clinical Officer",
        facility: "General Hospital",
        appliedDate: "2024-08-11",
        status: "Rejected",
    },
]
