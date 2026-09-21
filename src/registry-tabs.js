
ctx.render('<div class="ant-tabs ant-tabs-top" style="margin-bottom:8px;"><div class="ant-tabs-nav"><div class="ant-tabs-nav-wrap"><div id="registry-local-tabs" class="ant-tabs-nav-list" style="display:flex;border-bottom:1px solid #f0f0f0;"><div class="registry-local-tab ant-tabs-tab ant-tabs-tab-active" data-table="ozazmpm4o4v" style="cursor:pointer;padding:8px 4px;margin-right:24px;border-bottom:2px solid transparent;"><div class="ant-tabs-tab-btn">Активные</div></div><div class="registry-local-tab ant-tabs-tab" data-table="formtbl000001" style="cursor:pointer;padding:8px 4px;margin-right:24px;border-bottom:2px solid transparent;"><div class="ant-tabs-tab-btn">Формирующиеся</div></div><div class="registry-local-tab ant-tabs-tab" data-table="ipb7gfluldk" style="cursor:pointer;padding:8px 4px;margin-right:24px;border-bottom:2px solid transparent;"><div class="ant-tabs-tab-btn">Архив</div></div></div></div></div></div>');

const TABLES = ["ozazmpm4o4v", "formtbl000001", "ipb7gfluldk"];

function paintActive(uid) {
  document.querySelectorAll('.registry-local-tab').forEach(function(t) {
    const isActive = t.getAttribute('data-table') === uid;
    t.classList.toggle('ant-tabs-tab-active', isActive);
    t.style.borderBottomColor = isActive ? '#1677ff' : 'transparent';
    t.style.color = isActive ? '#1677ff' : 'rgba(0,0,0,0.88)';
    t.style.fontWeight = isActive ? '600' : '400';
  });
}

function applyVisibility(uid) {
  let allFound = true;
  TABLES.forEach(function(t) {
    const el = document.querySelector('[data-uid="' + t + '"]');
    const card = el ? el.closest('.ant-card') : null;
    if (card) {
      card.style.display = (t === uid) ? '' : 'none';
    } else {
      allFound = false;
    }
  });
  return allFound;
}

function switchRegistryTable(uid) {
  window.__activeRegistryTable = uid;
  applyVisibility(uid);
  paintActive(uid);
  const search = document.getElementById('global-search-input');
  if (search) search.value = '';
}
window.switchRegistryTable = switchRegistryTable;

document.querySelectorAll('.registry-local-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    switchRegistryTable(tab.getAttribute('data-table'));
  });
});

if (!window.__activeRegistryTable) {
  window.__activeRegistryTable = "ozazmpm4o4v";
}
if (!window.__registryVisibilityRetry) {
  window.__registryVisibilityRetry = setInterval(function() {
    const done = applyVisibility(window.__activeRegistryTable);
    if (done) {
      clearInterval(window.__registryVisibilityRetry);
      window.__registryVisibilityRetry = null;
    }
  }, 200);
}

