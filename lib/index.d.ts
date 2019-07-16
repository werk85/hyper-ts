/// <reference types="node" />
import * as E from 'fp-ts/lib/Either';
import { Predicate, Refinement } from 'fp-ts/lib/function';
import { IO } from 'fp-ts/lib/IO';
import { IOEither } from 'fp-ts/lib/IOEither';
import { Task } from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import { IncomingMessage } from 'http';
export declare const MediaType: {
    readonly applicationFormURLEncoded: "application/x-www-form-urlencoded";
    readonly applicationJSON: "application/json";
    readonly applicationJavascript: "application/javascript";
    readonly applicationOctetStream: "application/octet-stream";
    readonly applicationXML: "application/xml";
    readonly imageGIF: "image/gif";
    readonly imageJPEG: "image/jpeg";
    readonly imagePNG: "image/png";
    readonly multipartFormData: "multipart/form-data";
    readonly textCSV: "text/csv";
    readonly textHTML: "text/html";
    readonly textPlain: "text/plain";
    readonly textXML: "text/xml";
};
export declare type MediaType = typeof MediaType[keyof typeof MediaType];
export declare const Status: {
    readonly OK: 200;
    readonly Created: 201;
    readonly Found: 302;
    readonly BadRequest: 400;
    readonly Unauthorized: 401;
    readonly Forbidden: 403;
    readonly NotFound: 404;
    readonly MethodNotAllowed: 405;
    readonly NotAcceptable: 406;
    readonly ServerError: 500;
};
export declare type Status = typeof Status[keyof typeof Status];
export interface CookieOptions {
    readonly expires?: Date;
    readonly domain?: string;
    readonly httpOnly?: boolean;
    readonly maxAge?: number;
    readonly path?: string;
    readonly sameSite?: boolean | 'strict' | 'lax';
    readonly secure?: boolean;
    readonly signed?: boolean;
}
/** Type indicating that the status-line is ready to be sent */
export interface StatusOpen {
    readonly StatusOpen: unique symbol;
}
/** Type indicating that headers are ready to be sent, i.e. the body streaming has not been started */
export interface HeadersOpen {
    readonly HeadersOpen: unique symbol;
}
/** Type indicating that headers have already been sent, and that the body is currently streaming */
export interface BodyOpen {
    readonly BodyOpen: unique symbol;
}
/** Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished */
export interface ResponseEnded {
    readonly ResponseEnded: unique symbol;
}
/**
 * A `Connection`, models the entirety of a connection between the HTTP server and the user agent,
 * both request and response.
 * State changes are tracked by the phantom type `S`
 */
export interface Connection<S> {
    readonly _S: S;
    readonly getRequest: () => IncomingMessage;
    readonly getBody: () => unknown;
    readonly getHeader: (name: string) => unknown;
    readonly getParams: () => unknown;
    readonly getQuery: () => unknown;
    readonly getOriginalUrl: () => string;
    readonly getMethod: () => string;
    readonly setCookie: (this: Connection<HeadersOpen>, name: string, value: string, options: CookieOptions) => Connection<HeadersOpen>;
    readonly clearCookie: (this: Connection<HeadersOpen>, name: string, options: CookieOptions) => Connection<HeadersOpen>;
    readonly setHeader: (this: Connection<HeadersOpen>, name: string, value: string) => Connection<HeadersOpen>;
    readonly setStatus: (this: Connection<StatusOpen>, status: Status) => Connection<HeadersOpen>;
    readonly setBody: (this: Connection<BodyOpen>, body: unknown) => Connection<ResponseEnded>;
    readonly endResponse: (this: Connection<BodyOpen>) => Connection<ResponseEnded>;
}
export declare function gets<I, L, A>(f: (c: Connection<I>) => A): Middleware<I, I, L, A>;
export declare function fromConnection<I, L, A>(f: (c: Connection<I>) => E.Either<L, A>): Middleware<I, I, L, A>;
export declare function modifyConnection<I, O, L>(f: (c: Connection<I>) => Connection<O>): Middleware<I, O, L, void>;
/**
 * A middleware is an indexed monadic action transforming one `Conn` to another `Conn`. It operates
 * in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output `Conn` types of the
 * middleware action.
 */
export declare class Middleware<I, O, L, A> {
    readonly run: (c: Connection<I>) => TE.TaskEither<L, [A, Connection<O>]>;
    constructor(run: (c: Connection<I>) => TE.TaskEither<L, [A, Connection<O>]>);
    eval(c: Connection<I>): TE.TaskEither<L, A>;
    exec(c: Connection<I>): TE.TaskEither<L, Connection<O>>;
    map<I, L, A, B>(this: Middleware<I, I, L, A>, f: (a: A) => B): Middleware<I, I, L, B>;
    ap<I, L, A, B>(this: Middleware<I, I, L, A>, fab: Middleware<I, I, L, (a: A) => B>): Middleware<I, I, L, B>;
    chain<I, L, A, B>(this: Middleware<I, I, L, A>, f: (a: A) => Middleware<I, I, L, B>): Middleware<I, I, L, B>;
    /**
     * Combine two effectful actions, keeping only the result of the first
     */
    chainFirst<I, L, A, B>(this: Middleware<I, I, L, A>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, A>;
    /**
     * Combine two effectful actions, keeping only the result of the second
     */
    chainSecond<I, L, A, B>(this: Middleware<I, I, L, A>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, B>;
    ichain<Z, B>(f: (a: A) => Middleware<O, Z, L, B>): Middleware<I, Z, L, B>;
    foldMiddleware<Z, M, B>(onLeft: (l: L) => Middleware<I, Z, M, B>, onRight: (a: A) => Middleware<O, Z, M, B>): Middleware<I, Z, M, B>;
    mapLeft<M>(f: (l: L) => M): Middleware<I, O, M, A>;
    bimap<V, B>(f: (l: L) => V, g: (a: A) => B): Middleware<I, O, V, B>;
    orElse<M>(f: (l: L) => Middleware<I, O, M, A>): Middleware<I, O, M, A>;
    alt(fy: Middleware<I, O, L, A>): Middleware<I, O, L, A>;
    /** Returns a middleware that writes the response status */
    status<I, L, A>(this: Middleware<I, StatusOpen, L, A>, s: Status): Middleware<I, HeadersOpen, L, void>;
    /** Returns a middleware that writes the given headers */
    header<I, L, A>(this: Middleware<I, HeadersOpen, L, A>, name: string, value: string): Middleware<I, HeadersOpen, L, void>;
    /** Returns a middleware that sets the given `mediaType` */
    contentType<I, L, A>(this: Middleware<I, HeadersOpen, L, A>, mediaType: MediaType): Middleware<I, HeadersOpen, L, void>;
    /** Return a middleware that sets the cookie `name` to `value`, with the given `options` */
    cookie<I, L, A>(this: Middleware<I, HeadersOpen, L, A>, name: string, value: string, options: CookieOptions): Middleware<I, HeadersOpen, L, void>;
    /** Returns a middleware that clears the cookie `name` */
    clearCookie<I, L, A>(this: Middleware<I, HeadersOpen, L, A>, name: string, options: CookieOptions): Middleware<I, HeadersOpen, L, void>;
    /** Return a middleware that changes the connection status to `BodyOpen` */
    closeHeaders<I, L, A>(this: Middleware<I, HeadersOpen, L, A>): Middleware<I, BodyOpen, L, void>;
    /** Return a middleware that sends `body` as response body */
    send<I, L, A>(this: Middleware<I, BodyOpen, L, A>, body: string): Middleware<I, ResponseEnded, L, void>;
    /** Return a middleware that sends `body` as JSON */
    json<I, L, A>(this: Middleware<I, HeadersOpen, L, A>, body: unknown, onError: (reason: unknown) => L): Middleware<I, ResponseEnded, L, void>;
    /** Return a middleware that ends the response without sending any response body */
    end<I, L, A>(this: Middleware<I, BodyOpen, L, A>): Middleware<I, ResponseEnded, L, void>;
}
export declare function of<I, L, A>(a: A): Middleware<I, I, L, A>;
export declare function iof<I, O, L, A>(a: A): Middleware<I, O, L, A>;
export declare function tryCatch<I, L, A>(f: () => Promise<A>, onrejected: (reason: unknown) => L): Middleware<I, I, L, A>;
export declare function fromTaskEither<I, L, A>(fa: TE.TaskEither<L, A>): Middleware<I, I, L, A>;
export declare function right<I, L, A>(fa: Task<A>): Middleware<I, I, L, A>;
export declare function left<I, L, A>(fl: Task<L>): Middleware<I, I, L, A>;
export declare function fromLeft<I, L, A>(l: L): Middleware<I, I, L, A>;
export declare const fromEither: <I, L, A>(fa: E.Either<L, A>) => Middleware<I, I, L, A>;
export declare const fromIO: <I, L, A>(fa: IO<A>) => Middleware<I, I, L, A>;
export declare const fromIOEither: <I, L, A>(fa: IOEither<L, A>) => Middleware<I, I, L, A>;
export declare function fromPredicate<I, L, A, B extends A>(predicate: Refinement<A, B>, onFalse: (a: A) => L): (a: A) => Middleware<I, I, L, A>;
export declare function fromPredicate<I, L, A>(predicate: Predicate<A>, onFalse: (a: A) => L): (a: A) => Middleware<I, I, L, A>;
/** Returns a middleware that writes the response status */
export declare function status(status: Status): Middleware<StatusOpen, HeadersOpen, never, void>;
/** Returns a middleware that writes the given header */
export declare function header(name: string, value: string): Middleware<HeadersOpen, HeadersOpen, never, void>;
/** Returns a middleware that sets the given `mediaType` */
export declare function contentType(mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, never, void>;
/** Return a middleware that sets the cookie `name` to `value`, with the given `options` */
export declare function cookie(name: string, value: string, options: CookieOptions): Middleware<HeadersOpen, HeadersOpen, never, void>;
/** Returns a middleware that clears the cookie `name` */
export declare function clearCookie(name: string, options: CookieOptions): Middleware<HeadersOpen, HeadersOpen, never, void>;
/** Return a middleware that changes the connection status to `BodyOpen` */
export declare const closeHeaders: Middleware<HeadersOpen, BodyOpen, never, void>;
/** Return a middleware that sends `body` as response body */
export declare function send(body: string): Middleware<BodyOpen, ResponseEnded, never, void>;
/** Return a middleware that ends the response without sending any response body */
export declare const end: Middleware<BodyOpen, ResponseEnded, never, void>;
/** Return a middleware that sends `body` as JSON */
export declare function json<L>(body: unknown, onError: (reason: unknown) => L): Middleware<HeadersOpen, ResponseEnded, L, void>;
/** Return a middleware that sends a redirect to `uri` */
export declare function redirect(uri: string): Middleware<StatusOpen, HeadersOpen, never, void>;
/** Returns a middleware that tries to decode `connection.getParams()[name]` */
export declare function decodeParam<L, A>(name: string, f: (input: unknown) => E.Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A>;
/** Returns a middleware that tries to decode `connection.getParams()` */
export declare function decodeParams<L, A>(f: (input: unknown) => E.Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A>;
/** Returns a middleware that tries to decode `connection.getQuery()` */
export declare function decodeQuery<L, A>(f: (input: unknown) => E.Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A>;
/** Returns a middleware that tries to decode `connection.getBody()` */
export declare function decodeBody<L, A>(f: (input: unknown) => E.Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A>;
/** Returns a middleware that tries to decode `connection.getMethod()` */
export declare function decodeMethod<L, A>(f: (method: string) => E.Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A>;
/** Returns a middleware that tries to decode `connection.getHeader(name)` */
export declare function decodeHeader<L, A>(name: string, f: (input: unknown) => E.Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A>;
