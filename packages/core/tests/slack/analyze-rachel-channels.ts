import 'dotenv/config';

async function analyzeRachelChannels() {
  try {
    console.log('🔍 Analyzing all channels Rachel is a member of...\n');

    // Get Rachel's user ID first
    const usersResponse = await fetch('https://slack.com/api/users.list', {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
      }
    });

    const users = await usersResponse.json() as any;
    const rachel = users.members.find((u: any) =>
      u.profile?.email?.includes('rachel') ||
      u.name?.toLowerCase().includes('rachel')
    );

    if (!rachel) {
      console.log('❌ Could not find Rachel');
      return;
    }

    console.log(`✅ Found: ${rachel.real_name} (${rachel.id})\n`);

    // Fetch all channels
    const response = await fetch(`https://slack.com/api/users.conversations?user=${rachel.id}&types=public_channel,private_channel&limit=1000&exclude_archived=true`, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
      }
    });

    const data = await response.json() as any;

    if (!data.ok) {
      console.log(`❌ Error: ${data.error}`);
      return;
    }

    console.log(`📊 Total channels: ${data.channels.length}\n`);

    // Categorize channels by importance for a CPO
    const categories = {
      critical: [] as any[],
      leadership: [] as any[],
      product: [] as any[],
      team: [] as any[],
      operations: [] as any[],
      engineering: [] as any[],
      design: [] as any[],
      companyWide: [] as any[],
      social: [] as any[],
      other: [] as any[]
    };

    data.channels.forEach((ch: any) => {
      const name = ch.name.toLowerCase();

      const channel = {
        name: ch.name,
        id: ch.id,
        private: ch.is_private,
        members: ch.num_members || 0,
        topic: ch.topic?.value || '',
        purpose: ch.purpose?.value || ''
      };

      // Critical - direct reports, personal channels
      if (name.includes('cpo') || name.includes('directs') || name.includes('rachel')) {
        categories.critical.push(channel);
      }
      // Leadership
      else if (name.includes('leadership') || name.includes('exec') || name.includes('senior') || name.includes('director') || name.includes('vp')) {
        categories.leadership.push(channel);
      }
      // Product strategy
      else if (name.includes('product') || name.includes('roadmap') || name.includes('strategy') || name.includes('pm-') || name.includes('planning')) {
        categories.product.push(channel);
      }
      // Team management
      else if (name.includes('team') || name.includes('1-1') || name.includes('1:1') || name.includes('skip') || name.includes('manager')) {
        categories.team.push(channel);
      }
      // Operations
      else if (name.includes('operation') || name.includes('budget') || name.includes('hire') || name.includes('recruiting') || name.includes('headcount')) {
        categories.operations.push(channel);
      }
      // Engineering
      else if (name.includes('eng') || name.includes('dev') || name.includes('tech') || name.includes('platform')) {
        categories.engineering.push(channel);
      }
      // Design
      else if (name.includes('design') || name.includes('ux') || name.includes('ui')) {
        categories.design.push(channel);
      }
      // Company-wide
      else if (name.includes('announce') || name.includes('all-') || name.includes('company') || name.includes('webflow-')) {
        categories.companyWide.push(channel);
      }
      // Social/culture
      else if (name.includes('social') || name.includes('fun') || name.includes('random') || name.includes('watercooler') || name.includes('celebration')) {
        categories.social.push(channel);
      }
      else {
        categories.other.push(channel);
      }
    });

    const printCategory = (priority: string, title: string, channels: any[], limit = 20) => {
      if (channels.length > 0) {
        console.log(`\n${priority} ${title} (${channels.length} channels):`);
        console.log('═'.repeat(80));

        // Sort by member count (more members = likely more important)
        const sorted = channels.sort((a, b) => b.members - a.members);

        sorted.slice(0, limit).forEach((ch: any) => {
          const privacy = ch.private ? '🔒 Private' : '🌐 Public';
          const memberCount = ch.members > 0 ? `(${ch.members} members)` : '';
          console.log(`\n${privacy} | #${ch.name} ${memberCount}`);
          if (ch.topic) {
            console.log(`   Topic: ${ch.topic.substring(0, 80)}${ch.topic.length > 80 ? '...' : ''}`);
          }
          console.log(`   ID: ${ch.id}`);
        });

        if (sorted.length > limit) {
          console.log(`\n   ... and ${sorted.length - limit} more`);
        }
      }
    };

    printCategory('🔥', 'CRITICAL - Must Monitor Daily', categories.critical, 10);
    printCategory('👔', 'LEADERSHIP & STRATEGY', categories.leadership, 15);
    printCategory('📦', 'PRODUCT & ROADMAP', categories.product, 15);
    printCategory('👥', 'TEAM MANAGEMENT', categories.team, 15);
    printCategory('⚙️ ', 'OPERATIONS & HIRING', categories.operations, 10);
    printCategory('💻', 'ENGINEERING', categories.engineering, 10);
    printCategory('🎨', 'DESIGN', categories.design, 10);
    printCategory('🏢', 'COMPANY-WIDE', categories.companyWide, 10);
    printCategory('🎉', 'SOCIAL & CULTURE', categories.social, 10);
    printCategory('📁', 'OTHER CHANNELS', categories.other, 100);

    // Summary
    console.log('\n\n📈 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total channels: ${data.channels.length}`);
    console.log(`Critical (monitor daily): ${categories.critical.length}`);
    console.log(`Leadership: ${categories.leadership.length}`);
    console.log(`Product: ${categories.product.length}`);
    console.log(`Team: ${categories.team.length}`);
    console.log(`Operations: ${categories.operations.length}`);
    console.log(`Engineering: ${categories.engineering.length}`);
    console.log(`Design: ${categories.design.length}`);
    console.log(`Company-wide: ${categories.companyWide.length}`);
    console.log(`Social: ${categories.social.length}`);
    console.log(`Other: ${categories.other.length}`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

analyzeRachelChannels();
