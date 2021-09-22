 
const withCors = {
  credentials: 'include'
};

export const mkReq = (cmd=null, cors=true) => {
  const body = JSON.stringify(cmd || '');
  let req = {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body
  }
  if (cors) {
    req = {
      ...req,
      ...withCors
    }
  }
  return req;
};

export const getTimestamp = () => {
  return Math.floor(new Date().getTime() / 1000);
};