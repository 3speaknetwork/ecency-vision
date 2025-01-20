import axios, { AxiosResponse } from "axios"
import * as ls from "../util/local-storage";

// const baUrl = "http://localhost:4000"
const baUrl = "https://api.breakaway.community"
const accessToken = ls.get("ba_access_token")

export const createBreakawayUser = async (username: string, community: string, referral: string, email: string)=> {
    try {
        const data = {
            username,
            community,
            referral,
            email
        }
        const resp = await axios.post(`${baUrl}/signup-keychain`, data)
        return resp;
    } catch (err) {
        console.log(err)
        return err;
    }
}

export const createSolanaUser = async (email: string, password: string, solanaWalletAddress: string) => {
  try {
    const data = {
      email,
      password,
      solanaWalletAddress,
    };

    const resp = await axios.post(`${baUrl}/offchain-users/register`, data);

    return resp.data;
  } catch (err) {
    console.log(err);

    return { err }
  }
};

export const processLogin = async (username: string, ts: string, sig: string, community: string) => {
  try {
    const response: any = await axios.get(`${baUrl}/auth/login`, {
      params: { username, ts, sig, community },
    });

    const { token, ...user } = response.data.response;

    return response;

  } catch (error) { 
    console.error('Login Failed: ', error);
  }
};

export const claimBaPoints = async (username: string, community: string) => {
  try {
    const response = await axios.post(`${baUrl}/points/claim`, {
      username: username,
      community: community,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    );

    return response;
} catch (error) {
    console.error('Error claiming points:', error);
    throw error;
  }
};

export  const getBaUserPoints = async (username: string, community: string): Promise<any[] | undefined> => {
       
  try {
    const response: AxiosResponse | any = await axios.get(`${baUrl}/points?username=${username}&community=${community}`);

    return response;
  } catch (error) {
    console.error('Error fetching user points:', error);
    throw error;
  } 
};

export const updateUserPoints = async (username: string, community: string, pointType: string) => {
  try {
    const requestData = {
      username,
      community,
      pointType,
    };

    const response = await axios.post(`${baUrl}/points`, 
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}` ,
        },
      }
    );

    return response;
  } catch (error) {
    console.log('Error updating user points:', error);
    throw error;
  }
};

export const getBtcWalletBalance = async (address: string) => {
  try {
    const response = await axios.get(`${baUrl}/btc-balance/${address}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // console.log(response)

    return response.data;
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error);
    throw error;
  }
};

export const getBtcTransactions = async (address: string) => {
  try {
    const response = await axios.get(`${baUrl}/address-trx/${address}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // console.log(response);

    return response.data;
  } catch (error) {
    console.error('Error fetching Bitcoin transactions:', error);
    throw error;
  }
};

export const getUserByUsername = async (username: string) => {
  try {
    const response = await axios.get(`${baUrl}/user/${username}`);

    return response.data;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    throw error;
  }
};

export const createFreeAccount = async (username: string, keys: any) => {
  try {
    const response = await axios.post(`${baUrl}/create-free-account`, {username, accountKeys: keys});

    return response.data;
  } catch (error) {
    console.error('Something went wrong:', error);
    throw error;
  }
};

export const getAccountKeys = async (username: string) => {
  try {
    const response = await axios.post(`${baUrl}/get-account-keys`, {username});

    return response.data;
  } catch (error) {
    console.error('Something went wrong:', error);
    throw error;
  }
};

export const checkBtcMachine = async (address: string) => {
  try {
    const response = await axios.get(`${baUrl}/get-account-keys/${address}`);

    return response.data;
  } catch (error) {
    console.error('Something went wrong:', error);
    throw error;
  }
};



///////Btc ordinals
export const fetchOrdinals = async (address: any) => {
  const API_URL = `https://api.hiro.so/ordinals/v1/inscriptions?address=${address}`;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error: any) {
    console.error("Failed to fetch ordinals:", error.message);
    return [];
  }
};
