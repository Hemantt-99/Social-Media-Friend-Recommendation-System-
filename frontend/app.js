const messageEl = document.getElementById('message');
const profileEl = document.getElementById('profile');
const recsEl = document.getElementById('recommendations');

const navConnectionBadge = document.getElementById('navConnectionBadge');

const createUserModal = document.getElementById('createUserModal');
const addFriendModal = document.getElementById('addFriendModal');
const allUsersModal = document.getElementById('allUsersModal');

const createUserNavBtn = document.getElementById('createUserNavBtn');
const addFriendNavBtn = document.getElementById('addFriendNavBtn');
const viewAllUsersNavBtn = document.getElementById('viewAllUsersNavBtn');

const closeCreateUserModal = document.getElementById('closeCreateUserModal');
const closeAddFriendModal = document.getElementById('closeAddFriendModal');
const closeAllUsersModal = document.getElementById('closeAllUsersModal');

const allUsersContainer = document.getElementById('allUsersContainer');
const loadAllUsersBtn = document.getElementById('loadAllUsersBtn');
const miniLiveImageEl = document.getElementById('miniLiveImage');

const apiBase = 'http://localhost:5001';

function initBackgroundMarkers() {
  const layer = document.createElement('div');
  layer.className = 'bg-markers';

  const palette = ['#5dade2', '#a569bd', '#48c9b0', '#f5b041'];

  for (let index = 0; index < 18; index += 1) {
    const marker = document.createElement('span');
    marker.className = 'bg-marker';
    marker.style.left = `${Math.random() * 100}%`;
    marker.style.top = `${Math.random() * 100}%`;
    marker.style.color = palette[index % palette.length];
    marker.style.setProperty('--size', `${7 + Math.random() * 8}px`);
    marker.style.setProperty('--driftX', `${-14 + Math.random() * 28}px`);
    marker.style.setProperty('--driftY', `${-20 + Math.random() * 12}px`);
    marker.style.animationDelay = `${Math.random() * 8}s`;
    marker.style.animationDuration = `${10 + Math.random() * 8}s`;
    layer.appendChild(marker);
  }

  document.body.appendChild(layer);
}

function initMiniLiveImage() {
  if (!miniLiveImageEl) {
    return;
  }

  const imagePool = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80',
  ];

  let pointer = Math.floor(Math.random() * imagePool.length);

  const nextImage = () => {
    pointer = (pointer + 1) % imagePool.length;
    return imagePool[pointer];
  };

  miniLiveImageEl.src = imagePool[pointer];

  setInterval(() => {
    miniLiveImageEl.classList.add('swap');
    setTimeout(() => {
      miniLiveImageEl.src = nextImage();
      miniLiveImageEl.classList.remove('swap');
    }, 170);
  }, 4500);
}

function getApiUsersUrl() {
  return `${apiBase}/api/users`;
}

function setMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#c0392b' : '#1f7a1f';
}

function openModal(modal) {
  modal.classList.add('active');
}

function closeModal(modal) {
  modal.classList.remove('active');
}

function splitInterests(raw) {
  return (raw || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderProfile(profile) {
  profileEl.classList.remove('empty');
  profileEl.innerHTML = `
    <div class="profile-grid">
      <div class="metric"><span class="label">Name</span><span class="value">${profile.name || profile.username}</span></div>
      <div class="metric"><span class="label">Username</span><span class="value">${profile.username}</span></div>
      <div class="metric"><span class="label">User ID</span><span class="value">${profile.userId}</span></div>
      <div class="metric"><span class="label">Friends</span><span class="value">${(profile.friends || []).length}</span></div>
      <div class="metric"><span class="label">Location</span><span class="value">${profile.location.latitude}, ${profile.location.longitude}</span></div>
      <div class="metric"><span class="label">Interests</span><span class="value">${(profile.interests || []).join(', ') || 'None'}</span></div>
    </div>
  `;
}

function renderRecommendations(items) {
  recsEl.innerHTML = '';

  if (!items.length) {
    recsEl.classList.add('empty');
    recsEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-star"></i>
        <p>No recommendations available.</p>
      </div>
    `;
    return;
  }

  recsEl.classList.remove('empty');

  for (const item of items) {
    const block = document.createElement('article');
    block.className = 'recommendation-item';
    block.innerHTML = `
      <h4>${item.name || item.username} (@${item.username})</h4>
      <div class="recommendation-meta">
        <span><strong>ID:</strong> ${item.userId}</span>
        <span><strong>Mutual:</strong> ${item.mutualFriends}</span>
        <span><strong>Distance:</strong> ${item.distanceKm ?? 'N/A'} km</span>
        <span><strong>Interest:</strong> ${item.interestSimilarity ?? 0}</span>
        <span><strong>Score:</strong> ${item.score}</span>
      </div>
    `;
    recsEl.appendChild(block);
  }

}

function renderAllUsers(users) {
  allUsersContainer.innerHTML = '';

  if (!users || users.length === 0) {
    allUsersContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No users found in the system</p>
      </div>
    `;
    return;
  }

  users.forEach((user) => {
    const friendCount = user.friends ? user.friends.length : 0;
    const userCard = document.createElement('div');
    userCard.className = 'user-card';
    userCard.innerHTML = `
      <div class="user-info">
        <div class="user-name"><i class="fas fa-user-circle"></i> ${user.name || user.username}</div>
        <div class="user-id">@${user.username}</div>
        <div class="user-id">ID: ${user.userId}</div>
      </div>
      <div style="text-align: right;">
        <div class="friend-count">${friendCount}</div>
        <span class="friend-label"><i class="fas fa-users"></i> Friends</span>
      </div>
    `;
    allUsersContainer.appendChild(userCard);
  });

}

async function checkBackendConnection() {
  try {
    const res = await fetch(`${apiBase}/health`);
    if (!res.ok) throw new Error('Health check failed');
    navConnectionBadge.className = 'badge-small ok';
    navConnectionBadge.innerHTML = '<i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i>✓ Connected';
  } catch (_error) {
    navConnectionBadge.className = 'badge-small error';
    navConnectionBadge.innerHTML = '<i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i>✗ Offline';
    setMessage('Backend is offline. Start backend on port 5001.', true);
  }
}

createUserNavBtn.addEventListener('click', () => openModal(createUserModal));
addFriendNavBtn.addEventListener('click', () => openModal(addFriendModal));
viewAllUsersNavBtn.addEventListener('click', () => openModal(allUsersModal));

closeCreateUserModal.addEventListener('click', () => closeModal(createUserModal));
closeAddFriendModal.addEventListener('click', () => closeModal(addFriendModal));
closeAllUsersModal.addEventListener('click', () => closeModal(allUsersModal));

window.addEventListener('click', (event) => {
  if (event.target === createUserModal) closeModal(createUserModal);
  if (event.target === addFriendModal) closeModal(addFriendModal);
  if (event.target === allUsersModal) closeModal(allUsersModal);
});

document.getElementById('createUserForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    userId: document.getElementById('newUserId').value.trim(),
    username: document.getElementById('newUsername').value.trim(),
    location: {
      latitude: Number(document.getElementById('newLatitude').value),
      longitude: Number(document.getElementById('newLongitude').value),
    },
    interests: splitInterests(document.getElementById('newInterests').value),
    friends: [],
  };

  try {
    const response = await fetch(getApiUsersUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Create user failed');

    setMessage(`User "${data.username}" created successfully.`);
    event.target.reset();
    closeModal(createUserModal);
  } catch (error) {
    setMessage(error.message, true);
  }
});

document.getElementById('addFriendForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const userId = document.getElementById('sourceUserId').value.trim();
  const friendId = document.getElementById('friendUserId').value.trim();

  try {
    const response = await fetch(`${getApiUsersUrl()}/${userId}/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Add friend failed');

    setMessage(`${friendId} is now connected as a friend.`);
    event.target.reset();
    closeModal(addFriendModal);
  } catch (error) {
    setMessage(error.message, true);
  }
});

document.getElementById('loadProfileForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const userId = document.getElementById('lookupUserId').value.trim();
  const radiusKm = Number(document.getElementById('radiusKm').value || 100);

  try {
    const [profileRes, recoRes] = await Promise.all([
      fetch(`${getApiUsersUrl()}/${userId}`),
      fetch(`${getApiUsersUrl()}/${userId}/recommendations?radiusKm=${radiusKm}`),
    ]);

    const profile = await profileRes.json();
    const recommendationData = await recoRes.json();

    if (!profileRes.ok) throw new Error(profile.message || 'Profile fetch failed');
    if (!recoRes.ok) throw new Error(recommendationData.message || 'Recommendation fetch failed');

    renderProfile(profile);
    renderRecommendations(recommendationData.recommendations || []);
    setMessage('Profile and recommendations loaded.');
  } catch (error) {
    setMessage(error.message || 'Failed to fetch data', true);
  }
});

loadAllUsersBtn.addEventListener('click', async () => {
  try {
    allUsersContainer.innerHTML = '<div class="empty-state"><i class="fas fa-spinner"></i><p>Loading users...</p></div>';
    const response = await fetch(getApiUsersUrl());
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch users');

    renderAllUsers(data.users || []);
    setMessage(`Loaded ${(data.users || []).length} user(s).`);
  } catch (error) {
    setMessage(error.message || 'Failed to fetch users', true);
    allUsersContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>${error.message}</p>
      </div>
    `;
  }
});

checkBackendConnection();
initBackgroundMarkers();
initMiniLiveImage();
