import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

// Create a persistent cookie jar
const jar = new CookieJar();

// Setup the client with cookie support
const client = wrapper(axios.create({ 
    jar,
    withCredentials: true // Important for cookies
}));

/**
 * Example usage:
 * await client.post('https://site.com/login', { user, pass });
 * const { data } = await client.get('https://site.com/dashboard'); // Cookie is sent automatically
 */

export { client, jar };
