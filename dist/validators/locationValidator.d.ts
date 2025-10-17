/**
 * Source: Inspired by shsarv/TravelYaari-react validation patterns
 * Request validation using express-validator
 */
import type { Request, Response, NextFunction } from "express";
export declare const validate: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const createLocationValidation: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const updateLocationValidation: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const idValidation: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const queryValidation: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
//# sourceMappingURL=locationValidator.d.ts.map