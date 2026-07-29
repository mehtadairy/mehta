import { POST as shiprocketPostHandler } from '../shiprocket/route';

export async function POST(request: Request) {
  return shiprocketPostHandler(request);
}
