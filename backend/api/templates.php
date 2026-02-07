<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$type = $_GET['type'] ?? '';

$templates = [
    'earthquake' => [
        'template' => 'Naramdaman ang lindol na may lakas na [estimated intensity]. Nakararamdam ng [shaking duration]. Lokasyon: [specific area]. Mga nasira: [describe damage]. Mga tao: [safe/injured/evacuating].',
        'template_en' => 'Felt an earthquake with intensity of [estimated intensity]. Shaking duration: [shaking duration]. Location: [specific area]. Damages: [describe damage]. People: [safe/injured/evacuating].',
        'placeholders' => ['estimated intensity', 'shaking duration', 'specific area', 'describe damage', 'safe/injured/evacuating'],
        'tips' => 'Isulat kung gaano kalakas, ilang segundo, at kung may mga nasirang bagay o nasaktang tao.',
        'tips_en' => 'Describe the intensity, duration in seconds, and any damaged property or injured people.'
    ],
    'environmental' => [
        'template' => 'Nakita ang [environmental issue] sa [location]. Epekto: [describe impact]. Kailangan ng [immediate action].',
        'template_en' => 'Observed [environmental issue] at [location]. Impact: [describe impact]. Requires: [immediate action].',
        'placeholders' => ['environmental issue', 'location', 'describe impact', 'immediate action'],
        'tips' => 'Halimbawa: oil spill, illegal logging, pollution, o wildlife na nakulong.',
        'tips_en' => 'Examples: oil spill, illegal logging, pollution, or trapped wildlife.'
    ],
    'fire' => [
        'template' => 'May sunog sa [location]. Laki ng apoy: [small/medium/large]. Nasusunog: [building/vehicle/vegetation]. Mga tao: [safe/evacuating/trapped]. Nangangailangan ng [fire truck/ambulance].',
        'template_en' => 'Fire at [location]. Fire size: [small/medium/large]. Burning: [building/vehicle/vegetation]. People: [safe/evacuating/trapped]. Need: [fire truck/ambulance].',
        'placeholders' => ['location', 'small/medium/large', 'building/vehicle/vegetation', 'safe/evacuating/trapped', 'fire truck/ambulance'],
        'tips' => 'Tukuyin kung anong nasusunog at kung may mga tao na nasa loob o malapit.',
        'tips_en' => 'Specify what is burning and if there are people inside or nearby.'
    ],
    'flood' => [
        'template' => 'Baha sa [location]. Taas ng tubig: [estimate]. Mga naapektuhan: [houses/streets]. Mga tao: [evacuating/stranded]. Kailangan ng [rescue boat/relief].',
        'template_en' => 'Flood at [location]. Water level: [estimate]. Affected: [houses/streets]. People: [evacuating/stranded]. Need: [rescue boat/relief].',
        'placeholders' => ['location', 'estimate', 'houses/streets', 'evacuating/stranded', 'rescue boat/relief'],
        'tips' => 'Isulat kung gaano kataas ang tubig (lapad ng braso, baywang, etc.)',
        'tips_en' => 'Describe water depth (arm-length, waist-level, etc.)'
    ],
    'medical' => [
        'template' => 'Medical emergency sa [location]. Pasyente: [age/gender/condition]. Kailangan ng [ambulance/first aid]. Kasama: [bystanders/family].',
        'template_en' => 'Medical emergency at [location]. Patient: [age/gender/condition]. Need: [ambulance/first aid]. With: [bystanders/family].',
        'placeholders' => ['location', 'age/gender/condition', 'ambulance/first aid', 'bystanders/family'],
        'tips' => 'Ilagay kung ano ang sakit o injury at kung may kasamang tao.',
        'tips_en' => 'Specify the illness or injury and if there are people with the patient.'
    ],
    'security' => [
        'template' => 'Security incident sa [location]. Uri ng insidente: [theft/assault/disturbance]. Suspek: [description]. Mga biktima: [describe]. Kailangan ng [police/barangay].',
        'template_en' => 'Security incident at [location]. Incident type: [theft/assault/disturbance]. Suspect: [description]. Victims: [describe]. Need: [police/barangay].',
        'placeholders' => ['location', 'theft/assault/disturbance', 'description', 'describe', 'police/barangay'],
        'tips' => 'Deskartehan ang suspek kung possible at kung may mga nasaktan.',
        'tips_en' => 'Describe suspect if possible and if there are injured victims.'
    ],
    'wildlife' => [
        'template' => 'Nakita ang [wildlife species] sa [location]. Kilos: [behavior]. Danger level: [low/medium/high]. Kailangan ng [rescue/bantay].',
        'template_en' => 'Sighted [wildlife species] at [location]. Behavior: [behavior]. Danger level: [low/medium/high]. Need: [rescue/monitoring].',
        'placeholders' => ['wildlife species', 'location', 'behavior', 'low/medium/high', 'rescue/bantay'],
        'tips' => 'Tukuyin kung anong hayop at kung papel o delikado.',
        'tips_en' => 'Identify the animal and whether it is harmless or dangerous.'
    ]
];

if (isset($templates[$type])) {
    echo json_encode($templates[$type]);
} else {
    echo json_encode(['template' => '', 'placeholders' => [], 'tips' => '']);
}
?>
