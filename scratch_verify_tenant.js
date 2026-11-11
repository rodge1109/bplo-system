import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhtyktlktykotyzhxyps.supabase.co';
const supabaseKey = 'sb_publishable_KE2xNib4kr-vqqvDRleKAg_NfD07o1a';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMultiTenant() {
  console.log('Testing multi-tenant database insertion...');
  const refNo = 'CEBU-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const { data, error } = await supabase.from('bplo_application').insert([{
    tenant_code: 'CEBU',
    application_type: 'New',
    mode_of_payment: 'Quarterly',
    taxpayer_last_name: 'CebuResident',
    taxpayer_first_name: 'Maria',
    business_name: 'Cebu Commercial Hub',
    bus_city_municipality: 'Cebu City',
    bus_province: 'Cebu',
    bus_barangay: 'Lahug',
    reference_no: refNo
  }]).select();

  if (error) {
    console.error('Multi-tenant insert error:', error);
  } else {
    console.log('SUCCESS! Multi-tenant record inserted:', data);
  }
}

verifyMultiTenant();
