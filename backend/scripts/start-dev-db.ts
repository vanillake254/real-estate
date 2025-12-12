import EmbeddedPostgres from 'embedded-postgres';

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: './.pg-dev/data',
    user: 'realestate',
    password: 'realestate',
    port: 55432,
    persistent: true,
  } as any);

  await pg.initialise();
  await pg.start();
  await pg.createDatabase('realestate');
  // Keep process alive
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  process.stdin.resume();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
