#!/usr/bin/env node

import { getMaster, getRelease } from '../src/api/discogs.ts';
import { db } from '../src/db/index.ts';
import { albums } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

const debugDiscogsData = async () => {
  console.log('Debugging Discogs API responses...\n');
  
  try {
    // Get a few albums to test
    const existingAlbums = await db
      .select()
      .from(albums)
      .where(eq(albums.discogsId, albums.discogsId))
      .limit(3);
    
    const albumsToTest = existingAlbums.filter(album => album.discogsId != null);
    
    for (const album of albumsToTest) {
      console.log(`\n=== Testing Album: ${album.title} (Discogs ID: ${album.discogsId}) ===`);
      
      try {
        // Try master first
        let discogsData;
        try {
          discogsData = await getMaster({ id: album.discogsId! });
          console.log('✅ Fetched from MASTER endpoint');
        } catch (error) {
          try {
            discogsData = await getRelease({ id: album.discogsId! });
            console.log('✅ Fetched from RELEASE endpoint');
          } catch (releaseError) {
            console.log('❌ Failed to fetch from both endpoints');
            continue;
          }
        }
        
        // Log the full structure
        console.log('\n📋 Full API Response Structure:');
        console.log(JSON.stringify(discogsData, null, 2));
        
        // Check specific fields we're looking for
        console.log('\n🔍 Specific Fields Check:');
        console.log(`- formats: ${discogsData.formats ? 'YES' : 'NO'}`);
        if (discogsData.formats) {
          console.log(`  - formats[0]: ${JSON.stringify(discogsData.formats[0], null, 2)}`);
        }
        console.log(`- country: ${discogsData.country ? discogsData.country : 'NO'}`);
        console.log(`- labels: ${discogsData.labels ? 'YES' : 'NO'}`);
        if (discogsData.labels) {
          console.log(`  - labels[0]: ${JSON.stringify(discogsData.labels[0], null, 2)}`);
        }
        console.log(`- released: ${discogsData.released ? discogsData.released : 'NO'}`);
        console.log(`- tracklist: ${discogsData.tracklist ? 'YES (' + discogsData.tracklist.length + ' tracks)' : 'NO'}`);
        
        if (discogsData.tracklist && discogsData.tracklist.length > 0) {
          console.log(`  - first track: ${JSON.stringify(discogsData.tracklist[0], null, 2)}`);
        }
        
        break; // Only test the first album for now
        
      } catch (error) {
        console.error(`❌ Error: ${(error as Error).message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', (error as Error).message);
    process.exit(1);
  }
};

// Run the debug
debugDiscogsData();
