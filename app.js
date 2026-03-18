// Elements
const analyzeBtn = document.getElementById('analyzeBtn');
const locationInput = document.getElementById('locationInput');
const dashboard = document.getElementById('dashboard');
const searchError = document.getElementById('searchError');
const analysisLocationLabel = document.getElementById('analysisLocationLabel');

// Stats Elements
const statTotalBiz = document.getElementById('statTotalBiz');
const statSaturation = document.getElementById('statSaturation');
const statTopOpp = document.getElementById('statTopOpp');

// App & Modal Elements
const appContent = document.getElementById('appContent');
const signOutBtn = document.getElementById('signOutBtn');
const signOutMobile = document.getElementById('signOutMobile');
const signInModal = document.getElementById('signInModal');
const signInForm = document.getElementById('signInForm');

// Logic variables
let mapInstance = null;
let categoryChartInstance = null;
let demandChartInstance = null;
let currentLat = null;
let currentLng = null;

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 20) {
            nav.classList.add('shadow-md', 'backdrop-blur-xl', 'bg-white/95');
            nav.classList.remove('bg-white/80', 'shadow-sm');
        } else {
            nav.classList.remove('shadow-md', 'backdrop-blur-xl', 'bg-white/95');
            nav.classList.add('bg-white/80', 'shadow-sm');
        }
    });

    // Mock category filters logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => {
                b.classList.remove('bg-slate-900', 'text-white');
                b.classList.add('bg-white', 'text-slate-600');
            });
            e.target.classList.add('bg-slate-900', 'text-white');
            // Mock refreshing data
            if (currentLat !== null && currentLng !== null) {
                animateValues(currentLat + Math.random() * 0.001, currentLng);
            }
        });
    });

    // Sign In / Out Logic
    if (signInForm) {
        signInForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = signInForm.querySelector('button[type="submit"]');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
            btn.classList.add('opacity-80', 'pointer-events-none');
            
            // Simulate API call
            setTimeout(() => {
                btn.innerHTML = 'Success <i class="fa-solid fa-check"></i>';
                btn.classList.replace('bg-slate-900', 'bg-emerald-600');
                btn.classList.replace('hover:bg-slate-800', 'hover:bg-emerald-500');
                btn.classList.replace('shadow-slate-900/20', 'shadow-emerald-500/20');
                
                setTimeout(() => {
                    // Reset form
                    signInForm.reset();
                    btn.innerHTML = originalContent;
                    btn.classList.remove('opacity-80', 'pointer-events-none');
                    btn.classList.replace('bg-emerald-600', 'bg-slate-900');
                    btn.classList.replace('hover:bg-emerald-500', 'hover:bg-slate-800');
                    btn.classList.replace('shadow-emerald-500/20', 'shadow-slate-900/20');
                    
                    // Hide Modal and Show App Content
                    signInModal.classList.add('opacity-0', 'pointer-events-none');
                    setTimeout(() => {
                        signInModal.classList.add('hidden');
                        signInModal.classList.remove('flex');
                        
                        appContent.classList.remove('hidden');
                        setTimeout(() => {
                            appContent.classList.remove('opacity-0');
                        }, 50);
                    }, 500);
                }, 1000);
            }, 1000);
        });
    }

    const handleSignOut = () => {
        appContent.classList.add('opacity-0');
        setTimeout(() => {
            appContent.classList.add('hidden');
            
            signInModal.classList.remove('hidden');
            signInModal.classList.add('flex');
            setTimeout(() => {
                signInModal.classList.remove('opacity-0', 'pointer-events-none');
            }, 50);
        }, 700);
    };

    if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
    if (signOutMobile) signOutMobile.addEventListener('click', handleSignOut);

});


// Analyze Button logic
analyzeBtn.addEventListener('click', async () => {
    const loc = locationInput.value.trim();
    if (!loc) {
        searchError.classList.remove('hidden');
        searchError.classList.remove('opacity-0');
        searchError.classList.add('animate-pulse');
        locationInput.parentElement.classList.add('border-rose-400', 'bg-rose-50');
        setTimeout(() => {
            locationInput.parentElement.classList.remove('border-rose-400', 'bg-rose-50');
            searchError.classList.remove('animate-pulse');
        }, 800);
        return;
    }

    searchError.classList.add('hidden', 'opacity-0');
    analysisLocationLabel.innerText = loc;
    
    // Button loading state
    const originalBtnContent = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    analyzeBtn.classList.add('opacity-80', 'pointer-events-none');

    let lat = null;
    let lng = null;
    let foundLocationName = loc;
    let locationType = 'city';
    
    try {
        // Nominatim API requires a User-Agent header, otherwise it may block the request
        // Adding a broad search that works better for pin codes and areas
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1&addressdetails=1&countrycodes=in`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'OpporGap-App/1.0'
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
            locationType = data[0].addresstype || data[0].type || 'city';
            
            // If the user typed a vague "600001", try to read the full display name to clarify it to them
            if (data[0].display_name) {
                foundLocationName = data[0].display_name.split(',')[0] + ', ' + data[0].display_name.split(',').pop().trim();
                analysisLocationLabel.innerText = foundLocationName;
            }
        }
    } catch(e) { console.error("Geocoding failed:", e); /* silent fail handled below */ }

    if (lat === null || lng === null) {
        // Could not resolve location
        analyzeBtn.innerHTML = originalBtnContent;
        analyzeBtn.classList.remove('opacity-80', 'pointer-events-none');
        
        searchError.innerText = "Location not found. Please try a different city/area.";
        searchError.classList.remove('hidden', 'opacity-0');
        searchError.classList.add('animate-pulse');
        locationInput.parentElement.classList.add('border-rose-400', 'bg-rose-50');
        setTimeout(() => {
            locationInput.parentElement.classList.remove('border-rose-400', 'bg-rose-50');
            searchError.classList.remove('animate-pulse');
            setTimeout(() => { searchError.classList.add('hidden', 'opacity-0'); searchError.innerText = "Please enter a location to continue."; }, 3000);
        }, 800);
        return;
    }

    // Reveal Dashboard
    dashboard.classList.remove('hidden');
    
    // Very slight delay before scroll up to let DOM render
    setTimeout(() => {
        dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Revert button
        analyzeBtn.innerHTML = originalBtnContent;
        analyzeBtn.classList.remove('opacity-80', 'pointer-events-none');
        
        // Initialize components
        initData(lat, lng, locationType);
    }, 100);
});

// Seeded random number generator
function seededRandom(lat, lng, salt) {
    const x = Math.sin((lat || 0) * 12.9898 + (lng || 0) * 78.233 + salt) * 43758.5453;
    return x - Math.floor(x);
}

// Initialize dummy data and charts
function initData(lat, lng, locationType) {
    currentLat = lat;
    currentLng = lng;
    animateValues(lat, lng, locationType);
    initMap(lat, lng);
    initCharts(lat, lng);
    renderOpportunityCards(lat, lng, locationType);
}

function animateValues(lat, lng, locationType) {
    const totalBiz = Math.floor(500 + seededRandom(lat, lng, 1) * 2500);
    const satPercent = Math.floor(40 + seededRandom(lat, lng, 2) * 45); // 40 to 85
    
    animateCounter(statTotalBiz, 0, totalBiz, 1500);
    animateCounterPercent(statSaturation, 0, satPercent, 1500);
    
    // Simulate thinking delay for top opportunity
    let opps = [];
    const lowerType = (locationType || '').toLowerCase();
    if (lowerType === 'village' || lowerType === 'hamlet') {
        opps = ["Agricultural Tech", "Dairy Manager", "Rural Logistics", "Solar Installer", "Veterinary Assistant"];
    } else if (lowerType === 'town' || lowerType === 'suburb') {
        opps = ["Retail Manager", "Branch Banker", "High School Teacher", "Pharmacy Manager", "IT Support"];
    } else {
        opps = ["Software Engineer", "Data Analyst", "Digital Marketing", "Registered Nurse", "Financial Advisor"];
    }
    const topOppStr = opps[Math.floor(seededRandom(lat, lng, 3) * opps.length)];
    const topOppScore = Math.floor(85 + seededRandom(lat, lng, 4) * 14);

    statTopOpp.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-slate-300"></i>';
    setTimeout(() => {
        statTopOpp.innerHTML = `${topOppStr} <span class="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded ml-1">Score: ${topOppScore}/100</span>`;
    }, 1200);
}

function animateCounter(el, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        el.innerText = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function animateCounterPercent(el, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * (end - start) + start);
        el.innerText = currentVal + "%";
        
        if (el.nextElementSibling) {
            const progressBar = el.nextElementSibling.querySelector('.progress-fill');
            if (progressBar) {
                progressBar.style.width = currentVal + "%";
            }
        }

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Leaflet Map Initialization
function initMap(lat, lng) {
    if (mapInstance) {
        mapInstance.remove();
    }
    
    // Fallbacks just in case
    lat = lat || 40.7128;
    lng = lng || -74.0060;
    
    mapInstance = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([lat, lng], 14);

    // Modern light tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(mapInstance);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(mapInstance);

    // High competition zones (Red Heat/Circles)
    const hotZones = [
        [lat + 0.005, lng - 0.008],
        [lat - 0.003, lng + 0.005],
        [lat + 0.008, lng + 0.002]
    ];
    hotZones.forEach(coord => {
        L.circle(coord, {
            color: '#f43f5e',
            fillColor: '#f43f5e',
            fillOpacity: 0.2,
            weight: 1,
            radius: 400
        }).addTo(mapInstance).bindPopup('<b style="color:#e11d48">Saturated Zone</b><br>High business density here.');
    });

    // Opportunity zones (Green Circles)
    const oppZones = [
        [lat + 0.012, lng - 0.002],
        [lat - 0.008, lng - 0.010],
        [lat - 0.005, lng + 0.012]
    ];
    oppZones.forEach((coord, i) => {
        // Glowing effect with SVG icon logic 
        L.circle(coord, {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.3,
            weight: 2,
            radius: 300
        }).addTo(mapInstance).bindPopup(`<b style="color:#059669">Opportunity Gap #${i+1}</b><br>High demand, low supply detected.`);
    });
    
    // Some random existing business markers near the mapped location
    const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#0ea5e9; width:10px; height:10px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.3)'></div>",
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    for(let i=0; i<30; i++) {
        let rLat = lat + (Math.random() - 0.5) * 0.03;
        let rLng = lng + (Math.random() - 0.5) * 0.04;
        L.marker([rLat, rLng], {icon: customIcon}).addTo(mapInstance);
    }
}

// Chart.js Setup
function initCharts(lat, lng) {
    // Destroy previous if exist
    if (categoryChartInstance) categoryChartInstance.destroy();
    if (demandChartInstance) demandChartInstance.destroy();

    const catData = [
        Math.floor(20 + seededRandom(lat, lng, 5) * 30),
        Math.floor(15 + seededRandom(lat, lng, 6) * 25),
        Math.floor(10 + seededRandom(lat, lng, 7) * 20),
        Math.floor(5 + seededRandom(lat, lng, 8) * 15),
        Math.floor(5 + seededRandom(lat, lng, 9) * 15)
    ];

    // Category Doughnut
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    categoryChartInstance = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels: ['Retail', 'Food & Bev', 'Services', 'Tech', 'Health'],
            datasets: [{
                data: catData,
                backgroundColor: [
                    '#0ea5e9', // brand-500
                    '#f43f5e', // rose-500
                    '#10b981', // emerald-500
                    '#8b5cf6', // violet-500
                    '#f59e0b'  // amber-500
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: "'Inter', sans-serif", size: 12 }
                    }
                }
            }
        }
    });

    // Demand vs Competition Bar
    const ctxDemand = document.getElementById('demandChart').getContext('2d');
    
    // Create gradients for bars
    let gradientOpp = ctxDemand.createLinearGradient(0, 0, 0, 300);
    gradientOpp.addColorStop(0, '#10b981'); // emerald
    gradientOpp.addColorStop(1, '#059669');
    
    let gradientComp = ctxDemand.createLinearGradient(0, 0, 0, 300);
    gradientComp.addColorStop(0, '#f43f5e'); // rose
    gradientComp.addColorStop(1, '#e11d48');

    const barLabels = ['Coffee', 'Pet Care', 'Fitness', 'Co-working', 'Vegan Food'];
    const demandData = barLabels.map((_, i) => Math.floor(40 + seededRandom(lat, lng, 10 + i) * 60));
    const compData = barLabels.map((_, i) => Math.floor(20 + seededRandom(lat, lng, 20 + i) * 70));

    demandChartInstance = new Chart(ctxDemand, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [
                {
                    label: 'Demand Proxy',
                    data: demandData,
                    backgroundColor: gradientOpp,
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Competition',
                    data: compData,
                    backgroundColor: gradientComp,
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { borderDash: [4, 4], color: '#f1f5f9', drawBorder: false },
                    ticks: { display: false }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { font: { family: "'Inter', sans-serif" } }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, font: { family: "'Inter', sans-serif", size: 11 }}
                }
            }
        }
    });
}

function renderOpportunityCards(lat, lng, locationType) {
    const ruralJobs = [
        { title: "Agricultural Equipment Technician", icon: "fa-tractor", category: "Agriculture", desc: "High demand for repairing modern farming machinery.", color: "emerald" },
        { title: "Agrochemical Sales Rep", icon: "fa-seedling", category: "Sales", desc: "Need for supplying fertilizers and pesticides to local farmers.", color: "brand" },
        { title: "Dairy Farm Manager", icon: "fa-cow", category: "Farming", desc: "Opportunities in managing dairy production and operations.", color: "violet" },
        { title: "Veterinary Assistant", icon: "fa-stethoscope", category: "Healthcare", desc: "Assisting veterinarians in treating livestock.", color: "brand" },
        { title: "Rural Logistics Coordinator", icon: "fa-truck-fast", category: "Logistics", desc: "Managing crop transport and local supply chain.", color: "emerald" },
        { title: "Solar Panel Installer", icon: "fa-solar-panel", category: "Energy", desc: "Growing need for renewable energy setups in rural areas.", color: "amber" },
        { title: "Handicraft Coordinator", icon: "fa-hand-holding-heart", category: "Retail", desc: "Organizing local artisans for larger markets.", color: "rose" }
    ];

    const urbanJobs = [
        { title: "Software Engineer", icon: "fa-code", category: "Technology", desc: "High demand for full-stack developers in local tech hubs.", color: "brand" },
        { title: "Data Analyst", icon: "fa-chart-pie", category: "Technology", desc: "Companies seeking insights from consumer data.", color: "violet" },
        { title: "Digital Marketing Specialist", icon: "fa-bullhorn", category: "Marketing", desc: "Businesses need enhanced online presence.", color: "emerald" },
        { title: "Registered Nurse", icon: "fa-user-nurse", category: "Healthcare", desc: "Hospitals and clinics are urgently hiring nursing staff.", color: "rose" },
        { title: "Financial Advisor", icon: "fa-chart-line", category: "Finance", desc: "Wealth management services for urban professionals.", color: "brand" },
        { title: "Logistics Manager", icon: "fa-boxes-stacked", category: "Logistics", desc: "E-commerce growth driving need for supply chain experts.", color: "amber" },
        { title: "Graphic Designer", icon: "fa-pen-nib", category: "Design", desc: "Creative roles for agencies and corporate branding.", color: "violet" }
    ];

    const semiUrbanJobs = [
        { title: "Retail Store Manager", icon: "fa-store", category: "Retail", desc: "Managing consumer goods and supermarket branches.", color: "emerald" },
        { title: "Branch Banking Officer", icon: "fa-building-columns", category: "Finance", desc: "Local bank branches expanding their customer service teams.", color: "brand" },
        { title: "Educational Consultant", icon: "fa-chalkboard-user", category: "Education", desc: "Demand for qualified educators in growing towns.", color: "violet" },
        { title: "Supply Chain Supervisor", icon: "fa-truck", category: "Logistics", desc: "Overseeing distribution centers in semi-urban hubs.", color: "amber" },
        { title: "Pharmacy Manager", icon: "fa-pills", category: "Healthcare", desc: "Supervising medical dispensaries and local pharmacies.", color: "rose" },
        { title: "Insurance Agent", icon: "fa-shield-halved", category: "Sales", desc: "Expanding insurance coverage to developing areas.", color: "brand" },
        { title: "Real Estate Agent", icon: "fa-house", category: "Real Estate", desc: "Growing property markets in expanding suburban areas.", color: "emerald" }
    ];

    let allOpps = urbanJobs;
    const lowerType = (locationType || '').toLowerCase();
    if (lowerType === 'village' || lowerType === 'hamlet') {
        allOpps = ruralJobs;
    } else if (lowerType === 'town' || lowerType === 'suburb') {
        allOpps = semiUrbanJobs;
    }

    let oppPool = [...allOpps];
    for (let k = 0; k < oppPool.length; k++) {
        let swapIdx = k + Math.floor(seededRandom(lat, lng, 30 + k) * (oppPool.length - k));
        let temp = oppPool[k];
        oppPool[k] = oppPool[swapIdx];
        oppPool[swapIdx] = temp;
    }

    const oppData = [];
    for (let i = 0; i < 3; i++) {
        let opp = oppPool[i];
        let gapScore = Math.floor(75 + seededRandom(lat, lng, 40 + i) * 23);
        let demandLevel = seededRandom(lat, lng, 50 + i) > 0.5 ? "Very High" : "High";
        let compLevel = seededRandom(lat, lng, 60 + i) > 0.6 ? "Moderate" : "Low";
        
        oppData.push({
            ...opp,
            gapScore: gapScore,
            demand: demandLevel,
            comp: compLevel
        });
    }

    const container = document.getElementById('opportunitiesContainer');
    container.innerHTML = '';
    
    // Map colors to Tailwind tail names
    const colorMap = {
        'emerald': { 
            bg: 'bg-emerald-50', text: 'text-emerald-600', grad: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20',
            btnHover: 'hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
        },
        'brand': { 
            bg: 'bg-brand-50', text: 'text-brand-600', grad: 'from-brand-500 to-brand-600', shadow: 'shadow-brand-500/20',
            btnHover: 'hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700'
        },
        'violet': { 
            bg: 'bg-violet-50', text: 'text-violet-600', grad: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/20',
            btnHover: 'hover:border-violet-500 hover:bg-violet-50 hover:text-violet-700'
        },
        'amber': { 
            bg: 'bg-amber-50', text: 'text-amber-600', grad: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20',
            btnHover: 'hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700'
        },
        'rose': { 
            bg: 'bg-rose-50', text: 'text-rose-600', grad: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-500/20',
            btnHover: 'hover:border-rose-500 hover:bg-rose-50 hover:text-rose-700'
        }
    };

    oppData.forEach((opp, index) => {
        const colors = colorMap[opp.color];
        const cardDelay = (index * 0.15) + 0.9; // staggered animation delay
        
        const cardHTML = `
        <div class="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 hover:shadow-xl transition-all duration-300 opportunity-card group card-enter" style="animation-delay: ${cardDelay}s">
            <div class="flex justify-between items-start mb-6">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.grad} flex items-center justify-center text-white text-xl shadow-lg ${colors.shadow} group-hover:scale-110 transition-transform duration-300">
                    <i class="fa-solid ${opp.icon}"></i>
                </div>
                <!-- Circular Score Chart -->
                <div class="relative w-14 h-14 rounded-full flex items-center justify-center bg-slate-50 border-4 border-slate-100">
                    <svg viewBox="0 0 36 36" class="absolute w-full h-full -rotate-90 stroke-current ${colors.text} drop-shadow-sm">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-width="3" stroke-dasharray="${opp.gapScore}, 100" stroke-linecap="round"/>
                    </svg>
                    <span class="font-heading font-bold text-slate-800 text-sm">${opp.gapScore}</span>
                </div>
            </div>
            
            <div class="mb-5">
                <span class="text-xs font-bold uppercase tracking-wider ${colors.text} mb-1 block">${opp.category}</span>
                <h3 class="text-xl font-heading font-bold text-slate-900 leading-tight">${opp.title}</h3>
            </div>
            
            <p class="text-slate-500 text-sm mb-6 leading-relaxed">
                ${opp.desc}
            </p>
            
            <div class="bg-slate-50 rounded-xl p-4 flex justify-between items-center mb-6">
                <div>
                    <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Demand Propensity</p>
                    <p class="text-sm font-bold text-slate-800 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> ${opp.demand}</p>
                </div>
                <div class="w-px h-8 bg-slate-200"></div>
                <div>
                    <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Competition</p>
                    <p class="text-sm font-bold text-slate-800 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> ${opp.comp}</p>
                </div>
            </div>
            
            <button class="w-full py-3 rounded-xl border-2 border-slate-100 font-semibold text-slate-700 ${colors.btnHover} transition-all flex justify-center items-center gap-2 group-hover:border-slate-200">
                View Job Details <i class="fa-solid fa-arrow-right text-sm"></i>
            </button>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}
