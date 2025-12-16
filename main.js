// --- Cấu hình Scene ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 1. HỆ THỐNG HẠT CÂY THÔNG (Dài hơn và phân tán) ---
const treeCount = 15000; 
const treePositions = new Float32Array(treeCount * 3);
const treeColors = new Float32Array(treeCount * 3);

for (let i = 0; i < treeCount; i++) {
    const i3 = i * 3;
    const t = i / treeCount; 

    if (t > 0.05) { 
        const spiralT = (t - 0.05) / 0.95;
        const angle = spiralT * 45; // Tăng độ xoắn cho cây dài
        const radius = (1 - spiralT) * 18; 
        
        const spread = 2.5; 
        const randX = (Math.random() - 0.5) * spread;
        const randY = (Math.random() - 0.5) * spread;
        const randZ = (Math.random() - 0.5) * spread;

        // Tăng chiều cao lên 50 đơn vị (trước đó là 32)
        treePositions[i3] = Math.cos(angle) * radius + randX;
        treePositions[i3 + 1] = spiralT * 50 - 15 + randY; 
        treePositions[i3 + 2] = Math.sin(angle) * radius + randZ;
    } else { 
        // Gốc cây tập trung hạt dày đặc hơn
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 18;
        treePositions[i3] = Math.cos(angle) * radius;
        treePositions[i3 + 1] = -15 + Math.random() * 2;
        treePositions[i3 + 2] = Math.sin(angle) * radius;
    }

    const brightness = 0.8 + Math.random() * 0.2;
    treeColors[i3] = brightness;
    treeColors[i3 + 1] = brightness;
    treeColors[i3 + 2] = brightness + 0.1; 
}

const treeGeometry = new THREE.BufferGeometry();
treeGeometry.setAttribute('position', new THREE.BufferAttribute(treePositions, 3));
treeGeometry.setAttribute('color', new THREE.BufferAttribute(treeColors, 3));

const treeMaterial = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const tree = new THREE.Points(treeGeometry, treeMaterial);
scene.add(tree);

// --- 2. TẤM NỀN TUYẾT RỘNG & MỀM MẠI (Snow Ground) ---
// Tạo một kết cấu hình tròn mờ (Radial Gradient) bằng Canvas để làm rìa mượt hơn
function createCircleGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)'); // Tâm trắng sáng
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)'); // Nhạt dần
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Rìa biến mất hoàn toàn
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(canvas);
}

const floorGeometry = new THREE.PlaneGeometry(120, 120); // Làm tấm nền to hẳn ra (120x120)
const floorMaterial = new THREE.MeshBasicMaterial({ 
    map: createCircleGradientTexture(), // Dùng texture mờ rìa
    transparent: true, 
    blending: THREE.AdditiveBlending, // Giúp hòa trộn với bóng tối đẹp hơn
    side: THREE.DoubleSide,
    depthWrite: false 
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Nằm ngang
floor.position.y = -15.5; // Đặt thấp hơn gốc cây một chút
scene.add(floor);

// --- 3. NGÔI SAO TRẮNG ĐỨNG YÊN (Căn chuẩn đỉnh mới) ---
const starShape = new THREE.Shape();
for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? 2.5 : 1.0;
    const angle = (i * Math.PI) / 5 + (Math.PI / 2);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
}
starShape.closePath();

const starGeometry = new THREE.ExtrudeGeometry(starShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1 });
starGeometry.center();
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const starMesh = new THREE.Mesh(starGeometry, starMaterial);

// Đặt ở đỉnh cây thông mới (chiều cao 50 - 15 = 35)
starMesh.position.set(0, 36, 0); 
scene.add(starMesh);

const starGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/glow.png'),
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending
}));
starGlow.scale.set(10, 10, 1);
starMesh.add(starGlow);

// --- 4. HỆ THỐNG TUYẾT RƠI XUNG QUANH ---
const snowCount = 4000;
const snowPositions = new Float32Array(snowCount * 3);
const snowVelocities = new Float32Array(snowCount);

for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (Math.random() - 0.5) * 150;
    snowPositions[i * 3 + 1] = Math.random() * 100 - 40;
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 150;
    snowVelocities[i] = 0.05 + Math.random() * 0.1;
}

const snowGeometry = new THREE.BufferGeometry();
snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
const snowSystem = new THREE.Points(snowGeometry, new THREE.PointsMaterial({ size: 0.2, color: 0xffffff, transparent: true, opacity: 0.6 }));
scene.add(snowSystem);

// --- Cài đặt Camera ---
camera.position.z = 80; // Lùi camera xa hơn để thấy cây thông dài
camera.position.y = 10;

// --- 5. VÒNG LẶP ANIMATION ---
function animate() {
    requestAnimationFrame(animate);
    tree.rotation.y += 0.003;
    
    const s = 10 + Math.sin(Date.now() * 0.004) * 2;
    starGlow.scale.set(s, s, 1);

    const positions = snowSystem.geometry.attributes.position.array;
    for (let i = 0; i < snowCount; i++) {
        positions[i * 3 + 1] -= snowVelocities[i];
        if (positions[i * 3 + 1] < -40) positions[i * 3 + 1] = 60;
    }
    snowSystem.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}
animate();